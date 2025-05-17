import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faPaperclip, 
  faEllipsisV, 
  faArrowLeft, 
  faCamera, 
  faSmile, 
  faTrash, 
  faTimes, 
  faReply, 
  faSearch,
  faSync,
  faUserPlus,
  faUsers,
  faUser,
  faPlus,
  faInfoCircle,
  faExclamationTriangle,
  faCheck,
  faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';

const Chat = () => {
  const { user } = useSelector(state => state.auth);

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [socket, setSocket] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const [error, setError] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const requestPendingRef = useRef(false);
  const initialScrollDoneRef = useRef(false);

  // Inițializăm socket-ul - dar deocamdată îl dezactivăm pentru a putea testa restul interfeței
  useEffect(() => {
    if (user) {
      try {
        const newSocket = io(process.env.REACT_APP_SOCKET_URL || window.location.origin, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000
        });
        
        setSocket(newSocket);
        
        newSocket.on('connect', () => {
          console.log('Socket connected successfully');
          newSocket.emit('setup', user);
        });
        
        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setError('Eroare la conectarea la server. Încercăm să reconectăm...');
        });
        
        newSocket.on('typing', (data) => {
          if (selectedChat && selectedChat._id === data.chatId) {
            setTypingUsers(data.users);
          }
        });
        
        newSocket.on('new_message', (newMessage) => {
          if (selectedChat && selectedChat._id === newMessage.chat) {
            setMessages(prev => [...prev, newMessage]);
            
            // Marcăm mesajul ca citit
            markMessageAsRead(newMessage._id, newMessage.chat);
            
            // Actualizăm ultimul mesaj în lista de chat-uri
            updateChatLastMessage(newMessage);
            
            // Auto-scroll doar dacă suntem aproape de partea de jos
            setTimeout(() => {
              if (chatContainerRef.current) {
                const isNearBottom = chatContainerRef.current.scrollHeight - chatContainerRef.current.scrollTop - chatContainerRef.current.clientHeight < 100;
                
                if (isNearBottom) {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }, 100);
          } else {
            // Incrementăm contorul de mesaje necitite pentru chat-ul respectiv
            updateUnreadCount(newMessage.chat);
          }
        });
        
        newSocket.on('message_deleted_for_all', ({ messageId, chatId }) => {
          if (selectedChat && selectedChat._id === chatId) {
            setMessages(prev => prev.map(msg => 
              msg._id === messageId ? { ...msg, deletedForAll: true } : msg
            ));
          }
        });
        
        newSocket.on('message_read', ({ messageId, chatId, userId }) => {
          if (selectedChat && selectedChat._id === chatId) {
            setMessages(prev => prev.map(msg => 
              msg._id === messageId ? { 
                ...msg, 
                read: [...msg.read, { user: userId, readAt: new Date() }] 
              } : msg
            ));
          }
        });
        
        // Cleanup la deconectare
        return () => {
          newSocket.disconnect();
        };
      } catch (err) {
        console.error('Socket initialization error:', err);
        setError('Eroare la inițializarea socket-ului. Chat-ul în timp real este dezactivat.');
      }
    }
  }, [user]);

  // Fetch utilizatori disponibili pentru chat nou
  const fetchAvailableUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      
      if (res.data.success) {
        setAvailableUsers(res.data.data.filter(u => u._id !== user._id));
      } else {
        setError('Nu s-au putut obține utilizatorii');
      }
    } catch (err) {
      console.error('Eroare la obținerea utilizatorilor:', err);
      setError(err.response?.data?.message || 'Eroare la obținerea utilizatorilor');
    }
  };

  // Adăugăm chat-ul selectat la room-ul de socket
  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('join_chat', selectedChat._id);
      
      // Resetăm starea mesajelor când se schimbă chat-ul
      setMessages([]);
      setPage(1);
      setHasMore(true);
      initialScrollDoneRef.current = false;
    }
  }, [socket, selectedChat]);

  // Obținem lista de chat-uri
  useEffect(() => {
    const fetchChats = async () => {
      if (requestPendingRef.current) return;
      
      requestPendingRef.current = true;
      setLoading(true);
      
      try {
        const res = await axios.get('/api/chat');
        
        if (res.data.success) {
          setChats(res.data.data);
          setError(null);
        } else {
          setError('Nu s-au putut obține chat-urile');
        }
      } catch (err) {
        console.error('Eroare la obținerea chat-urilor:', err);
        setError(err.response?.data?.message || 'Eroare la obținerea chat-urilor');
      } finally {
        setLoading(false);
        requestPendingRef.current = false;
      }
    };

    if (user) {
      fetchChats();
    }
  }, [user]);

  // Creează un chat privat nou
  const createPrivateChat = async (userId) => {
    try {
      const res = await axios.post('/api/chat/private', { userId });
      
      if (res.data.success) {
        // Adăugăm noul chat la lista existentă
        setChats(prev => [res.data.data, ...prev]);
        
        // Selectăm noul chat
        setSelectedChat(res.data.data);
        
        // Închidem modalul
        setShowNewChatModal(false);
      } else {
        setError('Nu s-a putut crea conversația');
      }
    } catch (err) {
      console.error('Eroare la crearea conversației:', err);
      setError(err.response?.data?.message || 'Eroare la crearea conversației');
    }
  };

  // Creează un chat de grup nou
  const createGroupChat = async (e) => {
    e.preventDefault();
    
    if (!newGroupName.trim() || selectedUsers.length < 2) {
      setError('Completați numele grupului și selectați cel puțin 2 utilizatori');
      return;
    }
    
    try {
      const res = await axios.post('/api/chat/group', {
        name: newGroupName,
        users: selectedUsers
      });
      
      if (res.data.success) {
        // Adăugăm noul grup la lista existentă
        setChats(prev => [res.data.data, ...prev]);
        
        // Selectăm noul grup
        setSelectedChat(res.data.data);
        
        // Resetăm starea și închidem modalul
        setNewGroupName('');
        setSelectedUsers([]);
        setShowNewGroupModal(false);
      } else {
        setError('Nu s-a putut crea grupul');
      }
    } catch (err) {
      console.error('Eroare la crearea grupului:', err);
      setError(err.response?.data?.message || 'Eroare la crearea grupului');
    }
  };

  // Obținem mesajele pentru chat-ul selectat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      
      setMessagesLoading(true);
      
      try {
        const res = await axios.get(`/api/messages/${selectedChat._id}?page=1`);
        
        if (res.data.success) {
          // Asigurăm-ne că mesajele sunt în ordine cronologică
          setMessages(res.data.data.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          ));
          setHasMore(res.data.pagination.next !== undefined);
          setError(null);
          
          // Marcăm toate mesajele ca citite
          markChatAsRead(selectedChat._id);
          
          // Actualizăm contorul de mesaje necitite din UI
          updateChatUnreadCount(selectedChat._id, 0);
          
          // Auto-scroll la ultimul mesaj după încărcare
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            initialScrollDoneRef.current = true;
          }, 100);
        } else {
          setError('Nu s-au putut obține mesajele');
        }
      } catch (err) {
        console.error('Eroare la obținerea mesajelor:', err);
        setError(err.response?.data?.message || 'Eroare la obținerea mesajelor');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // Filtrează utilizatorii disponibili pentru chat nou
  const filteredAvailableUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  // Toggle selecție utilizator pentru grup
  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  // Funcție pentru a încărca mesaje mai vechi când facem scroll în sus
  const loadMoreMessages = async () => {
    if (!hasMore || messagesLoading || !selectedChat) return;
    
    setMessagesLoading(true);
    
    try {
      const nextPage = page + 1;
      
      // Păstrăm poziția inițială de scroll
      const scrollContainer = chatContainerRef.current;
      const scrollHeight = scrollContainer.scrollHeight;
      
      const res = await axios.get(`/api/messages/${selectedChat._id}?page=${nextPage}`);
      
      if (res.data.success) {
        if (res.data.data.length > 0) {
          // Adăugăm mesajele mai vechi la începutul listei, păstrând ordinea cronologică
          const oldMessages = res.data.data.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          setMessages(prev => [...oldMessages, ...prev]);
          setPage(nextPage);
          setHasMore(res.data.pagination.next !== undefined);
          
          // Ajustăm scroll-ul pentru a menține poziția vizibilă
          if (scrollContainer) {
            setTimeout(() => {
              scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollHeight;
            }, 10);
          }
        } else {
          setHasMore(false);
        }
      } else {
        setError('Nu s-au putut obține mesajele mai vechi');
      }
    } catch (err) {
      console.error('Eroare la încărcarea mesajelor vechi:', err);
      setError(err.response?.data?.message || 'Eroare la încărcarea mesajelor vechi');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Detectăm când utilizatorul face scroll în sus pentru a încărca mesaje mai vechi
  useEffect(() => {
    const container = chatContainerRef.current;
    
    const handleScroll = () => {
      if (container && container.scrollTop < 50 && hasMore && !messagesLoading) {
        loadMoreMessages();
      }
    };
    
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasMore, messagesLoading, selectedChat]);

  // Funcție pentru a actualiza contorul de mesaje necitite
  const updateUnreadCount = (chatId) => {
    setChats(prev => prev.map(chat => {
      if (chat._id === chatId) {
        return {
          ...chat,
          unreadCount: (chat.unreadCount || 0) + 1
        };
      }
      return chat;
    }));
  };

  // Funcție pentru a actualiza ultimul mesaj în lista de chat-uri
  const updateChatLastMessage = (message) => {
    setChats(prev => prev.map(chat => {
      if (chat._id === message.chat) {
        return {
          ...chat,
          latestMessage: message
        };
      }
      return chat;
    }));
  };

  // Funcție pentru a reseta contorul de mesaje necitite pentru un chat
  const updateChatUnreadCount = (chatId, count) => {
    setChats(prev => prev.map(chat => {
      if (chat._id === chatId) {
        return {
          ...chat,
          unreadCount: count
        };
      }
      return chat;
    }));
  };

  // Funcție pentru a marca un chat ca citit
  const markChatAsRead = async (chatId) => {
    try {
      await axios.put('/api/messages/read', { chatId });
    } catch (error) {
      console.error('Eroare la marcarea chat-ului ca citit:', error);
    }
  };

  // Funcție pentru a marca un mesaj specific ca citit
  const markMessageAsRead = async (messageId, chatId) => {
    try {
      await axios.put('/api/messages/read', { messageId, chatId });
    } catch (error) {
      console.error('Eroare la marcarea mesajului ca citit:', error);
    }
  };

  // Funcție pentru a trimite un mesaj
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' && !replyTo) return;
    
    try {
      const messageData = {
        content: newMessage,
        chatId: selectedChat._id
      };
      
      if (replyTo) {
        messageData.replyToId = replyTo._id;
      }

      // Oprim indicatorul de typing
      stopTyping();
      
      // Resetăm câmpul de mesaj și reply
      setNewMessage('');
      setReplyTo(null);
      
      const res = await axios.post('/api/messages', messageData);
      
      if (res.data.success) {
        // Adăugăm mesajul în lista locală
        setMessages(prev => [...prev, res.data.data]);
        
        // Scroll la ultimul mesaj
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Actualizăm ultimul mesaj în lista de chat-uri
        updateChatLastMessage(res.data.data);
      } else {
        setError('Nu s-a putut trimite mesajul');
      }
    } catch (error) {
      console.error('Eroare la trimiterea mesajului:', error);
      setError(error.response?.data?.message || 'Eroare la trimiterea mesajului');
    }
  };

  // Funcții pentru typing indicator
  const startTyping = () => {
    if (!socket || !selectedChat) return;
    
    // Emitem evenimente de typing la intervale pentru a menține indicatorul
    socket.emit('typing', { chatId: selectedChat._id, userId: user._id });
    
    // Resetăm timeout-ul anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Setăm un nou timeout pentru a opri indicatorul după 3 secunde de inactivitate
    typingTimeoutRef.current = setTimeout(stopTyping, 3000);
  };

  const stopTyping = () => {
    if (!socket || !selectedChat) return;
    
    socket.emit('stop_typing', { chatId: selectedChat._id, userId: user._id });
  };

  // Handler pentru input de mesaj
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Activăm indicatorul de typing
    if (typingUsers.indexOf(user._id) === -1) {
      startTyping();
    }
  };

  // Funcție pentru a șterge un mesaj
  const deleteMessage = async (messageId, deleteForAll = false) => {
    try {
      await axios.delete(`/api/messages/${messageId}${deleteForAll ? '?deleteForAll=true' : ''}`);
      
      if (deleteForAll) {
        // Socket.io va actualiza UI-ul pentru toți utilizatorii
      } else {
        // Actualizăm doar UI-ul local
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
      
      // Închidem meniul contextual
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    } catch (error) {
      console.error('Eroare la ștergerea mesajului:', error);
      setError(error.response?.data?.message || 'Eroare la ștergerea mesajului');
    }
  };

  // Funcție pentru a trimite un atașament
  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', selectedChat._id);
    
    if (replyTo) {
      formData.append('replyToId', replyTo._id);
    }
    
    if (newMessage.trim() !== '') {
      formData.append('content', newMessage);
    }
    
    try {
      const res = await axios.post('/api/messages/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        // Resetăm câmpul de mesaj și reply
        setNewMessage('');
        setReplyTo(null);
        
        // Adăugăm mesajul în lista locală
        setMessages(prev => [...prev, res.data.data]);
        
        // Actualizăm ultimul mesaj în lista de chat-uri
        updateChatLastMessage(res.data.data);
        
        // Ascundem opțiunile de atașament
        setShowAttachmentOptions(false);
        
        // Scroll la ultimul mesaj
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error('Eroare la încărcarea atașamentului');
      }
    } catch (error) {
      console.error('Eroare la încărcarea atașamentului:', error);
      setError(error.response?.data?.message || 'Eroare la încărcarea atașamentului');
    }
  };

  // Funcție pentru a deschide meniul contextual
  const handleMessageContextMenu = (e, messageId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId
    });
  };

  // Funcție pentru a închide meniul contextual când se face click în altă parte
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  // Funcție pentru a răspunde la un mesaj
  const handleReplyMessage = (message) => {
    setReplyTo(message);
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  // Componenta pentru afișarea unui mesaj
  const MessageItem = ({ message, isLast }) => {
    const isMine = message.sender._id === user._id;
    const isDeleted = message.deletedForAll;
    
    // Formatăm data mesajului
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div 
        className={`mb-2 d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
        onContextMenu={(e) => handleMessageContextMenu(e, message._id)}
      >
        <div style={{ maxWidth: '80%' }}>
          {/* Mesaj de reply */}
          {message.replyTo && (
            <div 
              className={`small mb-1 d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
            >
              <div 
                className="border-start ps-2 py-1 rounded"
                style={{ 
                  borderLeftColor: 'var(--primary-color)', 
                  borderLeftWidth: '3px',
                  backgroundColor: '#2a2a2a',
                  maxWidth: '90%'
                }}
              >
                <div className="text-primary">
                  {message.replyTo.sender.name}
                </div>
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                  {message.replyTo.deletedForAll ? (
                    <span className="fst-italic">Acest mesaj a fost șters</span>
                  ) : (
                    message.replyTo.content || 
                    (message.replyTo.attachmentType ? `[${
                      message.replyTo.attachmentType === 'image' ? 'Imagine' :
                      message.replyTo.attachmentType === 'audio' ? 'Audio' :
                      message.replyTo.attachmentType === 'video' ? 'Video' : 'Document'
                    }]` : '')
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div 
            className={`p-3 rounded ${
              isMine 
                ? 'bg-primary text-white' 
                : 'bg-dark text-white border border-secondary'
            } ${
              isDeleted 
                ? 'opacity-50 fst-italic' 
                : ''
            }`}
            style={{ 
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            {/* Numele expeditorului pentru mesaje în grup */}
            {!isMine && selectedChat.isGroupChat && !isDeleted && (
              <div className="fw-bold mb-1 text-info">
                {message.sender.name}
              </div>
            )}
            
            {/* Conținutul mesajului */}
            {isDeleted ? (
              <div>Acest mesaj a fost șters</div>
            ) : (
              <>
                {/* Conținutul text */}
                {message.content && (
                  <div className="message-text mb-1">{message.content}</div>
                )}
                
                {/* Atașament */}
                {message.attachment && (
                  <div className="message-attachment mb-2">
                    {message.attachmentType === 'image' ? (
                      <img 
                        src={`/api/messages/attachment/${message._id}`} 
                        alt="imagine" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '200px', cursor: 'pointer' }}
                      />
                    ) : message.attachmentType === 'audio' ? (
                      <audio controls className="w-100">
                        <source src={`/api/messages/attachment/${message._id}`} />
                      </audio>
                    ) : message.attachmentType === 'video' ? (
                      <video controls className="w-100 rounded">
                        <source src={`/api/messages/attachment/${message._id}`} />
                      </video>
                    ) : (
                      <div 
                        className="p-2 rounded" 
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      >
                        <a 
                          href={`/api/messages/attachment/${message._id}`} 
                          download={message.attachmentName}
                          className="text-decoration-none text-info"
                        >
                          <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                          {message.attachmentName || 'Document'}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Timpul mesajului și statusul de citit */}
                <div 
                  className="d-flex justify-content-end align-items-center"
                  style={{ fontSize: '11px', opacity: '0.7' }}
                >
                  <span>
                    {messageTime}
                  </span>
                  {isMine && (
                    <span className="ms-1">
                      {message.read && message.read.length > 0 ? (
                        <FontAwesomeIcon icon={faCheckDouble} className="text-info" />
                      ) : (
                        <FontAwesomeIcon icon={faCheck} />
                      )}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Referință pentru ultimul mesaj */}
          {isLast && <div ref={messagesEndRef} />}
        </div>
      </div>
    );
  };

  // Modal pentru chat nou privat
  const NewChatModal = () => (
    <div 
      className="modal fade show" 
      style={{ 
        display: showNewChatModal ? 'block' : 'none',
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">Conversație nouă</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setShowNewChatModal(false)}
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-dark text-white border-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input 
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Caută un utilizator"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="user-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filteredAvailableUsers.length === 0 ? (
                <div className="text-center text-muted p-3">
                  Nu există utilizatori disponibili
                </div>
              ) : (
                filteredAvailableUsers.map(user => (
                  <div 
                    key={user._id} 
                    className="user-item p-2 d-flex align-items-center border-bottom border-secondary"
                    style={{ cursor: 'pointer' }}
                    onClick={() => createPrivateChat(user._id)}
                  >
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        backgroundColor: '#333',
                        fontSize: '18px'
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="fw-bold">{user.name}</div>
                      {user.email && (
                        <div className="small text-muted">{user.email}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="modal-footer border-secondary">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowNewChatModal(false)}
            >
              Anulează
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal pentru grup nou
  const NewGroupModal = () => (
    <div 
      className="modal fade show" 
      style={{ 
        display: showNewGroupModal ? 'block' : 'none',
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">Grup nou</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setShowNewGroupModal(false)}
            ></button>
          </div>
          <form onSubmit={createGroupChat}>
           <div className="modal-body">
             <div className="mb-3">
               <label htmlFor="groupName" className="form-label">Numele grupului</label>
               <input 
                 type="text"
                 className="form-control bg-dark text-white border-secondary"
                 id="groupName"
                 placeholder="Introduceți numele grupului"
                 value={newGroupName}
                 onChange={(e) => setNewGroupName(e.target.value)}
                 required
               />
             </div>
             
             <div className="mb-3">
               <label className="form-label">Selectați membrii</label>
               <div className="input-group mb-2">
                 <span className="input-group-text bg-dark text-white border-secondary">
                   <FontAwesomeIcon icon={faSearch} />
                 </span>
                 <input 
                   type="text"
                   className="form-control bg-dark text-white border-secondary"
                   placeholder="Caută utilizatori"
                   value={userSearchTerm}
                   onChange={(e) => setUserSearchTerm(e.target.value)}
                 />
               </div>
               
               <div className="selected-users mb-2">
                 {selectedUsers.length > 0 && (
                   <div className="d-flex flex-wrap">
                     {selectedUsers.map(userId => {
                       const selectedUser = availableUsers.find(u => u._id === userId);
                       return selectedUser ? (
                         <div 
                           key={userId}
                           className="badge bg-primary me-1 mb-1 p-2 d-flex align-items-center"
                         >
                           {selectedUser.name}
                           <button 
                             type="button"
                             className="btn-close btn-close-white ms-2"
                             style={{ fontSize: '0.5rem' }}
                             onClick={() => toggleUserSelection(userId)}
                           ></button>
                         </div>
                       ) : null;
                     })}
                   </div>
                 )}
               </div>
               
               <div className="user-list border border-secondary rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                 {filteredAvailableUsers.length === 0 ? (
                   <div className="text-center text-muted p-3">
                     Nu există utilizatori disponibili
                   </div>
                 ) : (
                   filteredAvailableUsers.map(user => (
                     <div 
                       key={user._id} 
                       className={`user-item p-2 d-flex align-items-center border-bottom border-secondary ${
                         selectedUsers.includes(user._id) ? 'bg-primary bg-opacity-25' : ''
                       }`}
                       style={{ cursor: 'pointer' }}
                       onClick={() => toggleUserSelection(user._id)}
                     >
                       <div 
                         className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                         style={{ 
                           width: '40px', 
                           height: '40px',
                           backgroundColor: '#333',
                           fontSize: '18px'
                         }}
                       >
                         {user.name.charAt(0)}
                       </div>
                       <div className="flex-grow-1">
                         <div className="fw-bold">{user.name}</div>
                         {user.email && (
                           <div className="small text-muted">{user.email}</div>
                         )}
                       </div>
                       {selectedUsers.includes(user._id) && (
                         <div className="text-primary">
                           <FontAwesomeIcon icon={faCheck} />
                         </div>
                       )}
                     </div>
                   ))
                 )}
               </div>
             </div>
           </div>
           <div className="modal-footer border-secondary">
             <button 
               type="button" 
               className="btn btn-secondary" 
               onClick={() => {
                 setShowNewGroupModal(false);
                 setNewGroupName('');
                 setSelectedUsers([]);
               }}
             >
               Anulează
             </button>
             <button 
               type="submit" 
               className="btn btn-primary"
               disabled={!newGroupName.trim() || selectedUsers.length < 2}
             >
               Creează grup
             </button>
           </div>
         </form>
       </div>
     </div>
   </div>
 );

  return (
    <Layout>
      <div className="container-fluid h-100">
        {/* Header pentru pagina de chat - vizibil doar când nu este selectat un chat */}
        {!selectedChat && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Chat Ambu Life
              </h4>
              <div>
                <button 
                  className="btn btn-outline-light btn-sm me-2" 
                  onClick={() => {
                    setChats([]);
                    const fetchChats = async () => {
                      setLoading(true);
                      try {
                        const res = await axios.get('/api/chat');
                        if (res.data.success) {
                          setChats(res.data.data);
                        }
                      } catch (err) {
                        console.error('Eroare la reîmprospătarea chat-urilor:', err);
                        setError(err.response?.data?.message || 'Eroare la reîmprospătarea chat-urilor');
                      } finally {
                        setLoading(false);
                      }
                    };
                    fetchChats();
                  }}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />
                </button>
                <div className="dropdown d-inline-block">
                  <button 
                    className="btn btn-primary btn-sm dropdown-toggle"
                    id="newChatDropdown"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    Chat nou
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end" aria-labelledby="newChatDropdown">
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => {
                          setUserSearchTerm('');
                          fetchAvailableUsers();
                          setShowNewChatModal(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        Conversație privată
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => {
                          setUserSearchTerm('');
                          setNewGroupName('');
                          setSelectedUsers([]);
                          fetchAvailableUsers();
                          setShowNewGroupModal(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                        Grup nou
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Afișăm alerta de eroare dacă există */}
        {error && (
          <div className="alert alert-warning alert-dismissible fade show mb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* Container principal pentru chat */}
        {selectedChat ? (
          /* Interfața pentru conversația selectată */
          <div 
            className="chat-container bg-dark text-white border border-secondary rounded overflow-hidden d-flex flex-column"
            style={{ height: 'calc(100vh - 120px)' }}
          >
            {/* Header chat */}
            <div className="p-2 border-bottom border-secondary d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-sm btn-dark me-2"
                  onClick={() => setSelectedChat(null)}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <div className="d-flex align-items-center">
                  {selectedChat.isGroupChat ? (
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white me-2"
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        backgroundColor: '#0d6efd',
                        fontSize: '18px'
                      }}
                    >
                      {selectedChat.name.charAt(0)}
                    </div>
                  ) : (
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white me-2"
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        backgroundColor: '#198754',
                        fontSize: '18px'
                      }}
                    >
                      {selectedChat.users.find(u => u._id !== user._id)?.name.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <h6 className="mb-0">{selectedChat.name}</h6>
                    <small className="text-muted">
                      {selectedChat.isGroupChat 
                        ? `${selectedChat.users.length} participanți` 
                        : 'Online'}
                    </small>
                  </div>
                </div>
              </div>
              <div>
                <button 
                  className="btn btn-dark btn-sm"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <FontAwesomeIcon icon={faSearch} />
                </button>
              </div>
            </div>
            
            {/* Bara de căutare în chat */}
            {showSearch && (
              <div className="p-2 border-bottom border-secondary" style={{ backgroundColor: '#2a2a2a' }}>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Caută în conversație" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => setShowSearch(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Zona pentru răspuns la mesaj */}
            {replyTo && (
              <div 
                className="p-2 d-flex justify-content-between align-items-center border-bottom border-secondary"
                style={{ backgroundColor: '#2a2a2a' }}
              >
                <div className="d-flex align-items-center flex-grow-1">
                  <FontAwesomeIcon icon={faReply} className="me-2 text-primary" />
                  <div className="border-start border-primary ps-2" style={{ borderLeftWidth: '3px !important' }}>
                    <div className="text-primary small">
                      Răspuns către {replyTo.sender.name}
                    </div>
                    <div className="small text-truncate" style={{ maxWidth: '200px' }}>
                      {replyTo.deletedForAll ? (
                        <span className="fst-italic">Acest mesaj a fost șters</span>
                      ) : replyTo.content ? (
                        replyTo.content
                      ) : (
                        `[${
                          replyTo.attachmentType === 'image' ? 'Imagine' :
                          replyTo.attachmentType === 'audio' ? 'Audio' :
                          replyTo.attachmentType === 'video' ? 'Video' : 'Document'
                        }]`
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-sm text-muted" 
                  onClick={() => setReplyTo(null)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            )}
            
            {/* Container mesaje - MODIFICAT pentru a afișa mesajele în ordine cronologică corectă */}
            <div 
              className="flex-grow-1 p-2 overflow-auto" 
              ref={chatContainerRef}
              style={{ 
                backgroundColor: '#1a1a1a',
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {messagesLoading && messages.length === 0 ? (
                <div className="text-center my-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Se încarcă...</span>
                  </div>
                  <div className="mt-2 text-muted small">Se încarcă mesajele...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center my-3 text-muted">
                  <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '24px' }} className="mb-2" />
                  <div>Nu există mesaje în această conversație</div>
                  <div className="mt-2 small">Trimite primul mesaj pentru a începe conversația!</div>
                </div>
              ) : (
                <>
                  {/* Indicator pentru încărcarea mesajelor mai vechi */}
                  {messagesLoading && page > 1 && (
                    <div className="text-center my-2">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Se încarcă...</span>
                      </div>
                      <div className="small text-muted mt-1">Se încarcă mesaje mai vechi...</div>
                    </div>
                  )}
                  
                  {/* Lista de mesaje */}
                  {messages.map((message, index) => (
                    <MessageItem 
                      key={message._id} 
                      message={message} 
                      isLast={index === messages.length - 1}
                    />
                  ))}
                  
                  {/* Indicator typing */}
                  {typingUsers.length > 0 && (
                    <div className="small text-muted mt-2 mb-1 ms-2">
                      {typingUsers.length === 1 ? (
                        <div>Un utilizator scrie...</div>
                      ) : (
                        <div>Mai mulți utilizatori scriu...</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Footer chat pentru trimitere mesaje */}
            <div className="p-2 border-top border-secondary">
              {/* Opțiuni pentru atașamente */}
              {showAttachmentOptions && (
                <div 
                  className="d-flex flex-wrap mb-2 p-2 rounded"
                  style={{ backgroundColor: '#333' }}
                >
                  <div 
                    className="text-center mx-2 mb-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }}
                  >
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        backgroundColor: '#0d6efd',
                        color: 'white'
                      }}
                    >
                      <FontAwesomeIcon icon={faCamera} />
                    </div>
                    <div className="small">Imagine</div>
                  </div>
                  
                  <div 
                    className="text-center mx-2 mb-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                      fileInputRef.current.click();
                    }}
                  >
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                      style={{ 
                        width: '40px', 
                        height: '40px',
                        backgroundColor: '#198754',
                        color: 'white'
                      }}
                    >
                      <FontAwesomeIcon icon={faPaperclip} />
                    </div>
                    <div className="small">Document</div>
                  </div>
                  
                  <input 
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAttachmentUpload}
                  />
                </div>
              )}
              
              <form onSubmit={sendMessage}>
                <div className="input-group">
                  <button
                    type="button"
                    className="btn btn-dark border-secondary"
                    onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                  >
                    <FontAwesomeIcon icon={faPaperclip} />
                  </button>
                  
                  <input 
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Scrie un mesaj"
                    value={newMessage}
                    onChange={handleInputChange}
                    onBlur={stopTyping}
                  />
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={newMessage.trim() === ''}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Lista de conversații */
          <div 
            className="chat-list-container bg-dark text-white border border-secondary rounded overflow-hidden"
            style={{ height: 'calc(100vh - 120px)' }}
          >
            <div className="p-2 border-bottom border-secondary">
              <div className="input-group">
                <span className="input-group-text bg-dark text-white border-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input 
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Caută în conversații"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="chat-list overflow-auto" style={{ height: 'calc(100% - 56px)' }}>
              {loading ? (
                <div className="p-3 text-center">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Se încarcă...</span>
                  </div>
                  <div className="mt-2 small">Se încarcă conversațiile...</div>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <div className="mb-3">
                    <FontAwesomeIcon icon={faUsers} style={{ fontSize: '32px', opacity: '0.5' }} />
                  </div>
                  <h6>Nu există conversații</h6>
                  <p className="small mt-3">Începe o conversație nouă</p>
                  <button 
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => {
                      fetchAvailableUsers();
                      setShowNewChatModal(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Conversație nouă
                  </button>
                </div>
              ) : (
                chats
                  .filter(chat => 
                    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (chat.latestMessage && chat.latestMessage.content && 
                     chat.latestMessage.content.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(chat => (
                    <div 
                      key={chat._id} 
                      className="chat-item p-2"
                      onClick={() => setSelectedChat(chat)}
                      style={{ 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #2a2a2a',
                        position: 'relative'
                      }}
                    >
                      <div className="d-flex">
                        <div className="flex-shrink-0 me-2">
                          {chat.isGroupChat ? (
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white"
                              style={{ 
                                width: '48px', 
                                height: '48px',
                                backgroundColor: '#0d6efd',
                                fontSize: '20px'
                              }}
                            >
                              {chat.name.charAt(0)}
                            </div>
                          ) : (
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white"
                              style={{ 
                                width: '48px', 
                                height: '48px',
                                backgroundColor: '#198754',
                                fontSize: '20px'
                              }}
                            >
                              {chat.users.find(u => u._id !== user._id)?.name.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow-1 min-width-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 text-truncate" style={{ maxWidth: '160px' }}>
                              {chat.name}
                            </h6>
                            {chat.latestMessage && (
                              <small className="text-muted" style={{ fontSize: '11px' }}>
                                {new Date(chat.latestMessage.createdAt).toLocaleDateString()}
                              </small>
                            )}
                          </div>
                          
                          <div className="text-muted small text-truncate">
                            {chat.latestMessage ? (
                              <>
                                {chat.isGroupChat && chat.latestMessage.sender._id !== user._id && (
                                  <span className="fw-bold">{chat.latestMessage.sender.name}: </span>
                                )}
                                {chat.latestMessage.deletedForAll ? (
                                  <span className="fst-italic">Acest mesaj a fost șters</span>
                                ) : chat.latestMessage.attachment ? (
                                  <span>
                                    {chat.latestMessage.attachmentType === 'image' ? 'Imagine' :
                                     chat.latestMessage.attachmentType === 'audio' ? 'Audio' :
                                     chat.latestMessage.attachmentType === 'video' ? 'Video' : 'Document'}
                                    {chat.latestMessage.content && `: ${chat.latestMessage.content.substring(0, 20)}${chat.latestMessage.content.length > 20 ? '...' : ''}`}
                                  </span>
                                ) : (
                                  <span>
                                    {chat.latestMessage.content.substring(0, 30)}
                                    {chat.latestMessage.content.length > 30 ? '...' : ''}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span>Nu există mesaje</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Badge pentru mesaje necitite */}
                        {chat.unreadCount > 0 && (
                          <div 
                            className="position-absolute top-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              fontSize: '11px',
                              margin: '8px'
                            }}
                          >
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal-uri */}
      <NewChatModal />
      <NewGroupModal />
      
      {/* Meniu contextual pentru mesaje */}
      {contextMenu.visible && (
        <div 
          className="position-fixed"
          style={{ 
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 1050,
            minWidth: '160px',
            backgroundColor: '#2a2a2a',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #444'
          }}
        >
          <div 
            className="p-2 d-flex align-items-center"
            style={{ 
              cursor: 'pointer',
              hoverBackgroundColor: '#333'
            }}
            onClick={() => handleReplyMessage(messages.find(m => m._id === contextMenu.messageId))}
          >
            <FontAwesomeIcon icon={faReply} className="me-2" />
            <span>Răspunde</span>
          </div>
          
          {messages.find(m => m._id === contextMenu.messageId)?.sender._id === user._id && (
            <div 
              className="p-2 d-flex align-items-center text-danger"
              style={{ 
                cursor: 'pointer',
                hoverBackgroundColor: '#333'
              }}
              onClick={() => deleteMessage(contextMenu.messageId, true)}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              <span>Șterge pentru toți</span>
            </div>
          )}
          
          <div 
            className="p-2 d-flex align-items-center text-danger"
            style={{ 
              cursor: 'pointer',
              hoverBackgroundColor: '#333'
            }}
            onClick={() => deleteMessage(contextMenu.messageId, false)}
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            <span>Șterge pentru mine</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Chat;


