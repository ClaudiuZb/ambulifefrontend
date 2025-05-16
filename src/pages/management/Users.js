import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUsers, deleteUser } from '../../redux/actions/userActions';
import Layout from '../../components/layout/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faUser, faUserMd, faWrench } from '@fortawesome/free-solid-svg-icons';
import Spinner from '../../components/layout/Spinner';

// Stiluri custom pentru tema dark mode
const tableStyles = {
  table: {
    color: '#e9ecef',
    backgroundColor: 'transparent',
    borderColor: '#333',
    borderCollapse: 'separate',
    borderSpacing: '0'
  },
  tableHead: {
    backgroundColor: '#262626'
  },
  tableCell: {
    borderColor: '#333',
    padding: '12px 15px',
    backgroundColor: '#1e1e1e',
    color: '#e9ecef'  // Adăugat pentru a asigura că textul este alb
  },
  tableRow: {
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
    color: '#e9ecef'  // Adăugat pentru a asigura că textul este alb
  },
  tableRowEven: {
    backgroundColor: '#262626'
  },
  actionBtn: {
    marginRight: '8px'
  },
  editBtn: {
    color: '#457b9d',
    borderColor: '#457b9d',
    backgroundColor: 'transparent'
  },
  deleteBtn: {
    color: '#e74c3c',
    borderColor: '#e74c3c',
    backgroundColor: 'transparent'
  }
};

const Users = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { users, loading } = useSelector(state => state.user);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      dispatch(deleteUser(userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FontAwesomeIcon icon={faUser} style={{color: '#457b9d'}} />;
      case 'assistant':
        return <FontAwesomeIcon icon={faUserMd} style={{color: '#3498db'}} />;
      case 'mechanic':
        return <FontAwesomeIcon icon={faWrench} style={{color: '#f39c12'}} />;
      default:
        return <FontAwesomeIcon icon={faUser} />;
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'assistant':
        return 'Asistent Medical';
      case 'mechanic':
        return 'Mecanic';
      default:
        return 'Necunoscut';
    }
  };

  if (loading) {
    return <Layout><Spinner /></Layout>;
  }

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Gestionare Utilizatori</h1>
          <Link to="/users/add" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" /> Adaugă Utilizator
          </Link>
        </div>

        <div className="content-card" style={{backgroundColor: '#1e1e1e', border: '1px solid #333'}}>
          <div className="table-responsive" style={{ backgroundColor: '#1e1e1e', border: 'none' }}>
            <table className="table" style={tableStyles.table}>
              <thead style={{ backgroundColor: '#262626' }}>
                <tr>
                  <th style={{...tableStyles.tableCell, ...tableStyles.tableHead, color: '#e9ecef'}}>Nume</th>
                  <th style={{...tableStyles.tableCell, ...tableStyles.tableHead, color: '#e9ecef'}}>Email</th>
                  <th style={{...tableStyles.tableCell, ...tableStyles.tableHead, color: '#e9ecef'}}>Rol</th>
                  <th style={{...tableStyles.tableCell, ...tableStyles.tableHead, color: '#e9ecef'}}>Oraș</th>
                  <th style={{...tableStyles.tableCell, ...tableStyles.tableHead, color: '#e9ecef'}}>Telefon</th>
                  <th style={{...tableStyles.tableCell, ...tableStyles.tableHead, color: '#e9ecef'}}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={user._id} style={{
                      ...tableStyles.tableRow,
                      ...(index % 2 === 1 ? tableStyles.tableRowEven : {})
                    }}>
                      <td style={{...tableStyles.tableCell, color: '#e9ecef', backgroundColor: index % 2 === 1 ? '#262626' : '#1e1e1e'}}>
                        {getRoleIcon(user.role)} <span style={{marginLeft: '8px', color: '#e9ecef'}}>{user.name}</span>
                      </td>
                      <td style={{...tableStyles.tableCell, color: '#e9ecef', backgroundColor: index % 2 === 1 ? '#262626' : '#1e1e1e'}}>{user.email}</td>
                      <td style={{...tableStyles.tableCell, color: '#e9ecef', backgroundColor: index % 2 === 1 ? '#262626' : '#1e1e1e'}}>{getRoleName(user.role)}</td>
                      <td style={{...tableStyles.tableCell, color: '#e9ecef', backgroundColor: index % 2 === 1 ? '#262626' : '#1e1e1e'}}>{user.city ? user.city.name : 'Global'}</td>
                      <td style={{...tableStyles.tableCell, color: '#e9ecef', backgroundColor: index % 2 === 1 ? '#262626' : '#1e1e1e'}}>{user.phone || 'N/A'}</td>
                      <td style={{...tableStyles.tableCell, color: '#e9ecef', backgroundColor: index % 2 === 1 ? '#262626' : '#1e1e1e'}}>
                        <Link 
                          to={`/users/edit/${user._id}`} 
                          className="btn btn-sm" 
                          style={{...tableStyles.editBtn, ...tableStyles.actionBtn, color: '#457b9d'}}
                        >
                          <FontAwesomeIcon icon={faEdit} /> Edit
                        </Link>
                        <button 
                          className="btn btn-sm"
                          style={{...tableStyles.deleteBtn, color: '#e74c3c'}}
                          onClick={() => handleDeleteClick(user)}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Șterge
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr style={tableStyles.tableRow}>
                    <td colSpan="6" className="text-center" style={{...tableStyles.tableCell, color: '#e9ecef'}}>Nu există utilizatori</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de confirmare ștergere */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content" style={{backgroundColor: '#1e1e1e', color: '#e9ecef', border: '1px solid #333'}}>
              <div className="modal-header" style={{ borderBottom: '1px solid #333' }}>
                <h5 className="modal-title" style={{color: '#e9ecef'}}>Confirmare ștergere</h5>
                <button type="button" className="btn-close" style={{ filter: 'invert(1)' }} onClick={cancelDelete}></button>
              </div>
              <div className="modal-body" style={{color: '#e9ecef'}}>
                <p>Ești sigur că vrei să ștergi utilizatorul <strong>{userToDelete?.name}</strong>?</p>
                <p>Această acțiune nu poate fi anulată.</p>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #333' }}>
                <button type="button" className="btn btn-secondary" style={{color: '#e9ecef'}} onClick={cancelDelete}>
                  Anulează
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Șterge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;