import React, { useState, useEffect, useRef } from 'react';
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
  faCheckDouble,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';
import Layout from '../components/layout/Layout';

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

  // Adăugăm CSS pentru a rezolva problemele de afișare pe mobil
  useEffect(() => {
    if (!document.getElementById('chat-fix-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'chat-fix-styles';
      styleTag.innerHTML = `
        /* Resetare CSS pentru pagina de chat */
        .main-content {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
        }
        
        /* Ascunde sidebar-ul pe pagina de chat */
        body.chat-page .sidebar {
          display: none !important;
        }
        
        /* Container principal pentru chat */
        .chat-container {
          display: block !important;
          min-height: 100vh !important;
          width: 100% !important;
          overflow: hidden !important;
          background-color: #121212 !important;
        }
        
        /* Header pentru chat */
        .chat-header {
          display: flex !important;
          visibility: visible !important;
          width: 100% !important;
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333 !important;
          z-index: 100 !important;
        }
        
        /* Lista de chat-uri - fix pentru vizibilitate */
        .chat-list-view {
          display: block !important;
          visibility: visible !important;
          height: calc(100vh - 110px) !important;
          width: 100% !important;
          overflow-y: auto !important;
          z-index: 10 !important;
          background-color: #121212 !important;
        }
        
        /* Items din listă */
        .chat-item {
          display: flex !important;
          visibility: visible !important;
          width: 100% !important;
          padding: 10px !important;
          border-bottom: 1px solid #333 !important;
          background-color: #121212 !important;
        }
        
        /* Force visibility pentru conținutul conversațiilor */
        .chat-item-content {
          display: flex !important;
          visibility: visible !important;
          width: 100% !important;
        }
        
        /* Zona de mesaje când e selectat un chat */
        .messages-container {
          flex: 1 !important;
          overflow-y: auto !important;
          width: 100% !important;
          background-color: #121212 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        /* Bara de input pentru mesaje */
        .message-input-container {
          position: sticky !important;
          bottom: 0 !important;
          width: 100% !important;
          background-color: #1a1a1a !important;
          border-top: 1px solid #333 !important;
          padding: 8px !important;
          z-index: 100 !important;
        }
        
        /* Overlay pentru a preveni probleme de eveniment click */
        .modal-backdrop {
          z-index: 1040 !important;
        }
        
        /* Modals pentru creare chat-uri noi */
        .modal-content {
          z-index: 1050 !important;
        }
        
        /* Asigură că CSS-ul funcționează în ambele orientări */
        @media screen and (orientation: portrait), screen and (orientation: landscape) {
          .chat-item {
            visibility: visible !important;
            display: flex !important;
          }
          
          .chat-list-view {
            display: block !important;
            visibility: visible !important;
          }
          
          .chat-active-view {
            height: 100vh !important;
            width: 100% !important;
          }
        }
      `;
      document.head.appendChild(styleTag);
      
      // Marchează pagina pentru a putea aplica stiluri specifice
      document.body.classList.add('chat-page');
    }
    
    return () => {
      // Curăță stilul când componenta este demontată
      const styleTag = document.getElementById('chat-fix-styles');
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
      document.body.classList.remove('chat-page');
    };
  }, []);

  // Inițializăm socket-ul
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
            setTypingUsers(prevUsers => {
              if (!prevUsers.includes(data.userId)) {
                return [...prevUsers, data.userId];
              }
              return prevUsers;
            });
          }
        });
        
        newSocket.on('stop_typing', (data) => {
          if (selectedChat && selectedChat._id === data.chatId) {
            setTypingUsers(prevUsers => prevUsers.filter(id => id !== data.userId));
          }
        });
        
        newSocket.on('new_message', (newMessage) => {
          if (selectedChat && selectedChat._id === newMessage.chat) {
            setMessages(prev => [...prev, newMessage]);
            markMessageAsRead(newMessage._id, newMessage.chat);
            updateChatLastMessage(newMessage);
            
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
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
        
        return () => {
          newSocket.disconnect();
        };
      } catch (err) {
        console.error('Socket initialization error:', err);
        setError('Eroare la inițializarea chat-ului în timp real');
      }
    }
  }, [user, selectedChat]);

  // Fetch utilizatori disponibili pentru chat nou
  const fetchAvailableUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      
      if (res.data.success) {
        setAvailableUsers(res.data.data.filter(u => u._id !== user._id));
      }
    } catch (err) {
      console.error('Eroare la obținerea utilizatorilor:', err);
      setError('Nu s-au putut obține utilizatorii');
    }
  };

  // Adăugăm chat-ul selectat la room-ul de socket
  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('join_chat', selectedChat._id);
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
        setChats(prev => [res.data.data, ...prev]);
        setSelectedChat(res.data.data);
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
        setChats(prev => [res.data.data, ...prev]);
        setSelectedChat(res.data.data);
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
          setMessages(res.data.data.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          ));
          setHasMore(res.data.pagination.next !== undefined);
          setError(null);
          
          markChatAsRead(selectedChat._id);
          updateChatUnreadCount(selectedChat._id, 0);
          
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
      
      const scrollContainer = chatContainerRef.current;
      const scrollHeight = scrollContainer.scrollHeight;
      
      const res = await axios.get(`/api/messages/${selectedChat._id}?page=${nextPage}`);
      
      if (res.data.success) {
        if (res.data.data.length > 0) {
          const oldMessages = res.data.data.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          setMessages(prev => [...oldMessages, ...prev]);
          setPage(nextPage);
          setHasMore(res.data.pagination.next !== undefined);
          
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
      if (socket) {
        socket.emit('stop_typing', { chatId: selectedChat._id, userId: user._id });
      }
      
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
    
    socket.emit('typing', { chatId: selectedChat._id, userId: user._id });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
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
              <div className="fw-bold mb-1 text-info small">
                {message.sender.name}
              </div>
            )}
            
            {/* Conținutul mesajului */}
            {isDeleted ? (
              <div className="small">Acest mesaj a fost șters</div>
            ) : (
              <>
                {/* Conținutul text */}
                {message.content && (
                  <div className="message-text mb-1 small">{message.content}</div>
                )}
                
                {/* Atașament */}
                {message.attachment && (
                  <div className="message-attachment mb-2">
                    {message.attachmentType === 'image' ? (
                      <img 
                        src={`/api/messages/attachment/${message._id}`} 
                        alt="imagine" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '180px', cursor: 'pointer' }}
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
                          className="text-decoration-none text-info small"
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
                  style={{ fontSize: '10px', opacity: '0.7' }}
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

  // Stiluri pentru componentă
  const styles = {
    container: {
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#121212',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
    },
    searchBar: {
      padding: '8px',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
    },
    chatListContainer: {
      flex: '1',
      overflowY: 'auto',
      backgroundColor: '#121212',
    },
    messagesList: {
      flex: '1',
      overflowY: 'auto',
      padding: '10px',
      backgroundColor: '#121212',
      display: 'flex',
      flexDirection: 'column',
    },
    inputBar: {
      padding: '8px',
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid #333',
    },
    errorAlert: {
      margin: '8px',
      padding: '8px 12px',
      backgroundColor: 'rgba(220, 53, 69, 0.2)',
      color: '#dc3545',
      borderRadius: '4px',
      fontSize: '0.875rem',
      display: 'flex',
      alignItems: 'center',
    }
  };

  // Modal pentru chat nou privat
  const NewChatModal = () => (
    <div className="modal fade show" style={{ display: showNewChatModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">Conversație nouă</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowNewChatModal(false)}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-dark text-white border-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input 
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-secondary"
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
              className="btn btn-secondary btn-sm" 
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
    <div className="modal fade show" style={{ display: showNewGroupModal ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white border border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title">Grup nou</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowNewGroupModal(false)}></button>
          </div>
          <form onSubmit={createGroupChat}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="groupName" className="form-label">Numele grupului</label>
                <input 
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  id="groupName"
                  placeholder="Introduceți numele grupului"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Selectați membrii</label>
                <div className="input-group input-group-sm mb-2">
                  <span className="input-group-text bg-dark text-white border-secondary">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <input 
                    type="text"
                    className="form-control form-control-sm bg-dark text-white border-secondary"
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
                className="btn btn-secondary btn-sm" 
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
                className="btn btn-primary btn-sm"
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

  // Filtează chat-urile conform căutării
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.latestMessage && chat.latestMessage.content && 
     chat.latestMessage.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reload button pentru reîncărcare facilă
  const refreshData = async () => {
    setChats([]);
    setError(null);
    
    try {
      const res = await axios.get('/api/chat');
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (err) {
      console.error('Eroare la reîmprospătarea datelor:', err);
      setError('Nu s-au putut reîncărca datele. Încercați din nou.');
    }
  };

  return (
    <div className="chat-container" style={styles.container}>
      {selectedChat ? (
        // Vizualizare chat activ
        <div className="chat-active-view">
          {/* Header chat */}
          <div className="chat-header" style={styles.header}>
            <button 
              className="btn btn-sm btn-dark me-2"
              onClick={() => setSelectedChat(null)}
              style={{ padding: '4px 8px' }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-white me-2"
                style={{ 
                  width: '36px', 
                  height: '36px',
                  backgroundColor: selectedChat.isGroupChat ? '#0d6efd' : '#198754',
                  fontSize: '16px'
                }}
              >
                {selectedChat.isGroupChat 
                  ? selectedChat.name.charAt(0)
                  : selectedChat.users.find(u => u._id !== user._id)?.name.charAt(0) || '?'
                }
              </div>
              
              <div>
                <div className="fw-bold" style={{ fontSize: '14px' }}>{selectedChat.name}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>
                  {selectedChat.isGroupChat 
                    ? `${selectedChat.users.length} participanți` 
                    : 'Online'
                  }
                </div>
              </div>
            </div>
            
            <div className="ms-auto">
              <button 
                className="btn btn-sm btn-dark"
                onClick={() => setShowSearch(!showSearch)}
                style={{ padding: '4px 8px' }}
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>
          
          {/* Bară de căutare - vizibilă doar când este activată */}
          {showSearch && (
            <div style={styles.searchBar}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-dark text-white border-secondary">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
                <input 
                  type="text"
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  placeholder="Caută în conversație"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  className="btn btn-sm btn-dark border-secondary"
                  onClick={() => setShowSearch(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          )}
          
          {/* Bară de răspuns la mesaj */}
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
                  <div className="small text-truncate" style={{ maxWidth: '250px' }}>
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
          
          {/* Container mesaje */}
          <div 
            className="messages-container" 
            ref={chatContainerRef}
            style={styles.messagesList}
          >
            {messagesLoading && messages.length === 0 ? (
              <div className="text-center my-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Se încarcă...</span>
                </div>
                <div className="mt-2 small">Se încarcă mesajele...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center my-3 text-muted">
                <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '24px' }} className="mb-2" />
                <div>Nu există mesaje</div>
                <div className="mt-2 small">Trimite primul mesaj!</div>
              </div>
            ) : (
              // Lista de mesaje
              messages.map((message, index) => (
                <MessageItem 
                  key={message._id} 
                  message={message} 
                  isLast={index === messages.length - 1}
                />
              ))
            )}
            
            {/* Indicator pentru utilizatori care scriu */}
            {typingUsers.length > 0 && (
              <div className="small text-muted mt-2 mb-1">
                {typingUsers.length === 1 ? 
                  'Un utilizator scrie...' : 
                  'Mai mulți utilizatori scriu...'
                }
              </div>
            )}
          </div>
          
          {/* Bara de introducere a mesajelor */}
          <div className="message-input-container" style={styles.inputBar}>
            <form onSubmit={sendMessage} className="d-flex align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-dark border-secondary me-1"
                onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                style={{ padding: '4px 8px' }}
              >
                <FontAwesomeIcon icon={faPaperclip} />
              </button>
              
              <input 
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary mx-1"
                placeholder="Scrie un mesaj"
                value={newMessage}
                onChange={handleInputChange}
                onBlur={stopTyping}
                style={{ height: '36px' }}
              />
              
              <button 
                type="submit" 
                className="btn btn-sm btn-primary ms-1"
                disabled={newMessage.trim() === ''}
                style={{ padding: '4px 8px' }}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
            
            {/* Opțiuni pentru atașamente */}
            {showAttachmentOptions && (
              <div 
                className="d-flex mt-2 p-2 rounded justify-content-start"
                style={{ backgroundColor: '#333' }}
              >
                <div 
                  className="text-center me-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                    style={{ 
                      width: '36px', 
                      height: '36px',
                      backgroundColor: '#0d6efd',
                      color: 'white'
                    }}
                  >
                    <FontAwesomeIcon icon={faCamera} />
                  </div>
                  <div style={{ fontSize: '10px' }}>Imagine</div>
                </div>
                
                <div 
                  className="text-center"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                    style={{ 
                      width: '36px', 
                      height: '36px',
                      backgroundColor: '#198754',
                      color: 'white'
                    }}
                  >
                    <FontAwesomeIcon icon={faPaperclip} />
                  </div>
                  <div style={{ fontSize: '10px' }}>Document</div>
                </div>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAttachmentUpload}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // Vizualizare lista chat-uri
        <>
          {/* Header pentru lista de chat-uri */}
          <div className="chat-header" style={styles.header}>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faUsers} className="me-2" /> 
              <h5 className="mb-0" style={{ fontSize: '1.25rem' }}>Chat</h5>
            </div>
            <div className="d-flex">
              <button 
                className="btn btn-sm btn-dark me-2"
                onClick={refreshData}
                disabled={loading}
                style={{ padding: '4px 8px' }}
              >
                <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />
              </button>
              <div className="dropdown d-inline-block">
                <button 
                  className="btn btn-sm btn-primary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  Nou
                </button>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                  <li>
                    <button 
                      className="dropdown-item small" 
                      onClick={() => {
                        fetchAvailableUsers();
                        setShowNewChatModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Chat privat
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item small" 
                      onClick={() => {
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
          
          {/* Bara de căutare */}
          <div style={styles.searchBar}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark text-white border-secondary">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input 
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Caută în conversații"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Afișează eroarea dacă există */}
          {error && (
            <div style={styles.errorAlert}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
              <button 
                className="btn-close btn-close-white ms-auto" 
                onClick={() => setError(null)}
                style={{ fontSize: '10px' }}
              ></button>
            </div>
          )}
          
          {/* Lista de chat-uri */}
          <div className="chat-list-view" style={styles.chatListContainer}>
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Se încarcă...</span>
                </div>
                <div className="mt-2 text-light">Se încarcă conversațiile...</div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center p-4 text-light">
                <FontAwesomeIcon icon={faUsers} className="mb-2" style={{ fontSize: '2rem' }} />
                <p className="mb-3">Nu există conversații</p>
                <button 
                  className="btn btn-primary btn-sm"
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
              // Lista de chat-uri - fiecare item are class="chat-item" pentru a asigura vizibilitatea
              filteredChats.map(chat => (
                <div 
                  key={chat._id} 
                  className="chat-item" 
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-content">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white me-3 flex-shrink-0"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: chat.isGroupChat ? '#0d6efd' : '#198754',
                        fontSize: '20px'
                      }}
                    >
                      {chat.isGroupChat 
                        ? chat.name.charAt(0)
                        : chat.users.find(u => u._id !== user._id)?.name.charAt(0) || '?'
                      }
                    </div>
                    
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-bold text-truncate" style={{ maxWidth: '180px', fontSize: '14px' }}>
                          {chat.name}
                        </div>
                        {chat.latestMessage && (
                          <small className="text-muted" style={{ fontSize: '10px' }}>
                            {new Date(chat.latestMessage.createdAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                      
                      <div className="text-muted small text-truncate" style={{ fontSize: '12px' }}>
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
                        className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center ms-2 flex-shrink-0"
                        style={{ 
                          width: '20px', 
                          height: '20px',
                          fontSize: '12px'
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
        </>
      )}
      
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
              backgroundColor: '#2a2a2a'
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
                backgroundColor: '#2a2a2a'
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
              backgroundColor: '#2a2a2a'
            }}
            onClick={() => deleteMessage(contextMenu.messageId, false)}
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            <span>Șterge pentru mine</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
