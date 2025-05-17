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

// Stiluri CSS pentru componenta Chat - pentru a asigura aspect bun pe mobil
const chatStyles = {
  container: {
    height: 'calc(100vh - 56px)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  header: {
    padding: '8px 10px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '1.2rem',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  headerButtons: {
    display: 'flex',
    gap: '8px',
  },
  chatsList: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#121212',
  },
  chatItem: {
    padding: '10px',
    borderBottom: '1px solid #2a2a2a',
    cursor: 'pointer',
    position: 'relative',
  },
  activeChatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#121212',
  },
  activeChatHeader: {
    padding: '8px 10px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#121212',
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainer: {
    padding: '8px 10px',
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
  },
  errorAlert: {
    margin: '8px 0',
    padding: '8px 12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    color: '#dc3545',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
  },
  loadingContainer: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
  },
  emptyStateContainer: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
  },
  button: {
    padding: '6px 12px',
    borderRadius: '4px',
    backgroundColor: '#0d6efd',
    color: 'white',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  smallButton: {
    padding: '4px 8px',
    fontSize: '0.75rem',
  },
  iconButton: {
    width: '36px',
    height: '36px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid #444',
    color: 'white',
    cursor: 'pointer',
  },
};

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

  // Adăugăm CSS pentru Chat component - pentru mobile-optimized
  useEffect(() => {
    // Verificăm dacă există deja stilul
    if (!document.getElementById('chat-component-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'chat-component-styles';
      styleTag.innerHTML = `
        /* Optimizări pentru dispozitive mobile */
        @media (max-width: 767px) {
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Ascunde sidebar-ul pe pagina de chat pentru mobil */
          body.chat-page .sidebar {
            display: none !important;
          }
          
          /* Setează înălțimea containerului de chat la full viewport */
          .chat-container {
            height: 100vh !important;
          }
          
          /* Asigură-te că header-ul și footer-ul sunt fixe */
          .chat-header, .chat-footer {
            position: fixed;
            left: 0;
            right: 0;
            z-index: 1000;
          }
          
          .chat-header {
            top: 0;
          }
          
          .chat-footer {
            bottom: 0;
          }
          
          /* Ajustează conținutul principal pentru a avea spațiu pentru header și footer */
          .chat-messages-container {
            padding-top: 60px;
            padding-bottom: 60px;
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

  // Fetch chats logic...
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
  
  // Socket.io logic - dezactivat temporar pentru test
  
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
  
  // Alte funcții rămân aproape neschimbate...
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

  // Oferim refresh button pentru a reîncărca datori în caz de probleme
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

  return (
    <div className="chat-container" style={chatStyles.container}>
      {selectedChat ? (
        // Vizualizare chat activ
        <div className="chat-active-view" style={chatStyles.activeChatContainer}>
          {/* Header chat */}
          <div className="chat-header" style={chatStyles.activeChatHeader}>
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
          
          {/* Container mesaje */}
          <div 
            className="chat-messages-container" 
            ref={chatContainerRef}
            style={chatStyles.messageContainer}
          >
            {messagesLoading && messages.length === 0 ? (
              <div style={chatStyles.loadingContainer}>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Se încarcă...</span>
                </div>
                <div className="mt-2 small">Se încarcă mesajele...</div>
              </div>
            ) : messages.length === 0 ? (
              <div style={chatStyles.emptyStateContainer}>
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
          <div className="chat-footer" style={chatStyles.inputContainer}>
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
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
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
                    fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                    fileInputRef.current.click();
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
                  onChange={() => {}} // Handlerul real ar trebui restaurat
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // Vizualizare lista chat-uri
        <div className="chat-list-view" style={{ height: '100%' }}>
          {/* Header pentru lista de chat-uri */}
          <div style={chatStyles.header}>
            <h5 style={chatStyles.headerTitle}>
              <FontAwesomeIcon icon={faUsers} className="me-2" /> 
              Chat
            </h5>
            <div style={chatStyles.headerButtons}>
              <button 
                style={chatStyles.iconButton}
                onClick={refreshData}
                className="me-2"
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
                      onClick={() => {}} // Handlerul real ar trebui restaurat
                    >
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Chat privat
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item small" 
                      onClick={() => {}} // Handlerul real ar trebui restaurat
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
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #333' }}>
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
          
          {/* Lista de chat-uri */}
          <div className="chats-list" style={chatStyles.chatsList}>
            {loading ? (
              <div style={chatStyles.loadingContainer}>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Se încarcă...</span>
                </div>
                <div className="mt-2 small">Se încarcă conversațiile...</div>
              </div>
            ) : chats.length === 0 ? (
              <div style={chatStyles.emptyStateContainer}>
                <FontAwesomeIcon icon={faUsers} style={{ fontSize: '24px', opacity: '0.5' }} className="mb-2" />
                <div className="mb-2">Nu există conversații</div>
                <button 
                  style={{...chatStyles.button, ...chatStyles.smallButton}}
                  onClick={() => {}} // Handlerul real ar trebui restaurat
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
                    onClick={() => setSelectedChat(chat)}
                    style={chatStyles.chatItem}
                  >
                    <div className="d-flex">
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
                          <div className="fw-bold text-truncate" style={{ maxWidth: '150px', fontSize: '14px' }}>
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
                          className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '18px', 
                            height: '18px',
                            fontSize: '10px',
                            position: 'absolute',
                            top: '8px',
                            right: '8px'
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
          
          {/* Afișează eroarea dacă există */}
          {error && (
            <div style={chatStyles.errorAlert}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
              <button 
                className="btn-close btn-close-white ms-auto" 
                onClick={() => setError(null)}
                style={{ fontSize: '10px' }}
              ></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;


