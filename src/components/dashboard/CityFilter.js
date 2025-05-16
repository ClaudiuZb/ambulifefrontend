import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Importăm acțiunea de setare a orașului (vom implementa-o ulterior)
// import { setSelectedCity } from '../../redux/actions/cityActions';

const CityFilter = () => {
  const dispatch = useDispatch();
  // Presupunem că vom avea un state pentru orașe și orașul selectat
  // const { cities, selectedCity } = useSelector(state => state.city);
  
  // Mock data până implementăm acțiunile și reducerii pentru orașe
  const cities = [
    { _id: 'all', name: 'Toate orașele' },
    { _id: 'suceava', name: 'Suceava' },
    { _id: 'botosani', name: 'Botoșani' }
  ];
  const selectedCity = 'all';
  
  const handleCityChange = (e) => {
    // dispatch(setSelectedCity(e.target.value));
    console.log('Orașul selectat:', e.target.value);
  };
  
  return (
    <div className="city-filter">
      <div className="row align-items-center">
        <div className="col">
          <h5 className="mb-0">Filtrare după oraș</h5>
        </div>
        <div className="col-auto">
          <select 
            className="form-select"
            value={selectedCity}
            onChange={handleCityChange}
          >
            {cities.map(city => (
              <option key={city._id} value={city._id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CityFilter;