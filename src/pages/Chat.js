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
  const [orientation, setOrientation] = useState(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const requestPendingRef = useRef(false);
  const initialScrollDoneRef = useRef(false);

  // Detectează orientarea ecranului
  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Adăugăm CSS pentru Chat component - pentru mobile-optimized
  useEffect(() => {
    // Verificăm dacă există deja stilul
    if (!document.getElementById('chat-component-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'chat-component-styles';
      styleTag.innerHTML = `
        /* Ascunde sidebar-ul pe pagina de chat pentru mobil */
        body.chat-page .sidebar {
          display: none !important;
        }
        
        /* Setează înălțimea containerului de chat la full viewport */
        .chat-container {
          height: 100vh !important;
          width: 100% !important;
          overflow: hidden !important;
        }
        
        /* Resetează marginile și padding pentru main-content pe mobile */
        .main-content {
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Fix pentru liste în diferite orientări */
        .chat-list {
          max-height: calc(100vh - 110px) !important;
          overflow-y: auto !important;
          width: 100% !important;
        }
        
        /* Asigură-te că elementele din listă sunt întotdeauna vizibile indiferent de orientare */
        .chat-item {
          display: flex !important;
          width: 100% !important;
        }
        
        /* Fix pentru headerul chat */
        .chat-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100% !important;
        }
        
        /* Adaptează containerul de mesaje */
        .chat-messages-container {
          overflow-y: auto !important;
          flex: 1 !important;
          width: 100% !important;
        }
        
        /* Chat footer fixed pentru inputul de mesaje */
        .chat-footer {
          position: sticky;
          bottom: 0;
          width: 100% !important;
          background-color: #1a1a1a !important;
          z-index: 1000;
        }
        
        /* Optimizări specifice pentru orientare portrait */
        @media screen and (orientation: portrait) {
          .chat-list-container {
            height: calc(100vh - 60px) !important;
            overflow-y: auto !important;
          }
        }
        
        /* Optimizări specifice pentru orientare landscape */
        @media screen and (orientation: landscape) {
          .chat-list-container {
            height: calc(100vh - 60px) !important;
            overflow-y: auto !important;
          }
          
          .chat-item {
            padding: 5px 10px !important;
          }
        }
      `;
      document.head.appendChild(styleTag);
      
      // Adăugă clasa chat-page la body
      document.body.classList.add('chat-page');
    }
    
    return () => {
      // Curățăm stilul când componenta este demontată
      const styleTag = document.getElementById('chat-component-styles');
      if (styleTag) {
        document.head.removeChild(styleTag);
      }
      // Elimină clasa chat-page din body
      document.body.classList.remove('chat-page');
    };
  }, []);

  // Fetch chats logic
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
  
  // Celelălte funcții de logică existente...
  
  // Fetch messages and other logic...
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
  
  // Funcțiile necesare pentru a face chatul să funcționeze
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

  const markChatAsRead = async (chatId) => {
    try {
      await axios.put('/api/messages/read', { chatId });
    } catch (error) {
      console.error('Eroare la marcarea chat-ului ca citit:', error);
    }
  };

  const markMessageAsRead = async (messageId, chatId) => {
    try {
      await axios.put('/api/messages/read', { messageId, chatId });
    } catch (error) {
      console.error('Eroare la marcarea mesajului ca citit:', error);
    }
  };

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

  // Refresh button pentru reîncărcarea datelor în caz de probleme
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

  // Componenta pentru afișarea unui mesaj
  const MessageItem = ({ message, isLast }) => {
    const isMine = message.sender._id === user._id;
    const isDeleted = message.deletedForAll;
    
    // Formatăm data mesajului
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div 
        className={`mb-2 d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
        style={{ maxWidth: '100%' }}
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
                <div className="text-truncate" style={{ maxWidth: '160px' }}>
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
            className={`p-2 rounded ${
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

  // Stiluri pentru componenta Chat
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      backgroundColor: '#121212',
    },
    chatHeader: {
      padding: '8px 12px',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    chatListContainer: {
      height: 'calc(100vh - 60px)',
      overflowY: 'auto',
      backgroundColor: '#121212',
    },
    chatList: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },
    chatItem: {
      padding: orientation === 'portrait' ? '10px' : '8px 10px',
      borderBottom: '1px solid #2a2a2a',
      cursor: 'pointer',
      backgroundColor: '#121212',
      width: '100%',
    },
    messageContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px',
      backgroundColor: '#121212',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
    },
    inputBar: {
      padding: '8px 10px',
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid #333',
    },
    searchBar: {
      padding: '8px 10px',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
    },
    errorAlert: {
      margin: '8px 10px',
      padding: '8px 12px',
      backgroundColor: 'rgba(220, 53, 69, 0.2)',
      color: '#dc3545',
      borderRadius: '4px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '20px',
      color: '#999',
    },
    loadingState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#999',
    },
  };

  return (
    <div className="chat-container" style={styles.container}>
      {selectedChat ? (
        // Vizualizare chat activ
        <div className="d-flex flex-column h-100">
          {/* Header chat */}
          <div className="chat-header" style={styles.chatHeader}>
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
          
          {/* Container mesaje */}
          <div 
            className="chat-messages-container" 
            ref={chatContainerRef}
            style={styles.messageContainer}
          >
            {messagesLoading && messages.length === 0 ? (
              <div style={styles.loadingState}>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Se încarcă...</span>
                </div>
                <div className="mt-2 small">Se încarcă mesajele...</div>
              </div>
            ) : messages.length === 0 ? (
              <div style={styles.emptyState}>
                <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: '24px' }} className="mb-2" />
                <div>Nu există mesaje</div>
                <div className="mt-2 small">Trimite primul mesaj!</div>
              </div>
            ) : (
              // Mesajele
              messages.map((message, index) => (
                <MessageItem 
                  key={message._id} 
                  message={message} 
                  isLast={index === messages.length - 1}
                />
              ))
            )}
          </div>
          
          {/* Footer pentru trimitere mesaje */}
          <div className="chat-footer" style={styles.inputBar}>
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
                onChange={(e) => setNewMessage(e.target.value)}
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
            
            {/* Opțiuni pentru atașamente - afișate doar când sunt deschise */}
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
                  onChange={() => {}} // Implementarea reală aici
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // Vizualizare lista chat-uri
        <>
          {/* Header pentru lista de chat-uri */}
          <div className="chat-header" style={styles.chatHeader}>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faUsers} className="me-2" /> 
              <h5 className="mb-0 fs-5">Chat</h5>
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
              <div className="dropdown">
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
                      onClick={() => setShowNewChatModal(true)}
                    >
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Chat privat
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item small" 
                      onClick={() => setShowNewGroupModal(true)}
                    >
                      <FontAwesomeIcon icon={faUsers} className="me-2" />
                      Grup nou
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Casetă de căutare */}
          <div style={styles.searchBar}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark text-white border-secondary">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input 
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Caută conversații"
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
                style={{ fontSize: '10px' }}
                onClick={() => setError(null)}
              ></button>
            </div>
          )}
          
          {/* Lista de chat-uri */}
          <div className="chat-list-container" style={styles.chatListContainer}>
            <div className="chat-list" style={styles.chatList}>
              {loading ? (
                <div style={styles.loadingState}>
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Se încarcă...</span>
                  </div>
                  <div className="mt-2 small">Se încarcă conversațiile...</div>
                </div>
              ) : chats.length === 0 ? (
                <div style={styles.emptyState}>
                  <FontAwesomeIcon icon={faUsers} style={{ fontSize: '24px', opacity: '0.5' }} className="mb-2" />
                  <div className="mb-2">Nu există conversații</div>
                  <button 
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => setShowNewChatModal(true)}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                    Conversație nouă
                  </button>
                </div>
              ) : (
                // Lista de chat-uri filtrată
                chats
                  .filter(chat => 
                    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (chat.latestMessage && chat.latestMessage.content && 
                    chat.latestMessage.content.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map(chat => (
                    <div 
                      key={chat._id} 
                      className="chat-item" 
                      style={styles.chatItem}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="d-flex w-100 align-items-center">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white me-2 flex-shrink-0"
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            backgroundColor: chat.isGroupChat ? '#0d6efd' : '#198754',
                            fontSize: '16px'
                          }}
                        >
                          {chat.isGroupChat 
                            ? chat.name.charAt(0)
                            : chat.users.find(u => u._id !== user._id)?.name.charAt(0) || '?'
                          }
                        </div>
                        
                        <div className="flex-grow-1 min-width-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="fw-bold text-truncate" style={{ 
                              maxWidth: orientation === 'portrait' ? '150px' : '220px', 
                              fontSize: '14px' 
                            }}>
                              {chat.name}
                            </div>
                            {chat.latestMessage && (
                              <small className="text-muted" style={{ fontSize: '10px' }}>
                                {new Date(chat.latestMessage.createdAt).toLocaleDateString()}
                              </small>
                            )}
                          </div>
                          
                          <div className="text-muted small text-truncate" style={{ 
                            fontSize: '12px',
                            maxWidth: orientation === 'portrait' ? '190px' : '260px'
                          }}>
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
                            className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center ms-1"
                            style={{ 
                              width: '18px', 
                              height: '18px',
                              fontSize: '10px',
                              flexShrink: 0,
                              marginLeft: '3px'
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
        </>
      )}
      
      {/* Modal pentru conversatie nouă - implementare simplă */}
      {showNewChatModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                
                <div className="alert alert-secondary text-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Funcționalitatea de chat nou este dezactivată în această versiune
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewChatModal(false)}>
                  Anulează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pentru grup nou - implementare simplă */}
      {showNewGroupModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Grup nou</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowNewGroupModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-secondary text-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  Funcționalitatea de creare grup este dezactivată în această versiune
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewGroupModal(false)}>
                  Anulează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
