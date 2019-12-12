import React from "react";
//import axios from 'axios';
//import { useHistory } from 'react-router-dom';

const Profile = ({ authenticateUser  }) => {
  var user = localStorage.getItem("user");
  var email = localStorage.getItem("email");

  
  return (
    <div>
      <h2> Your Profile </h2>
      <h5> Username: {user} </h5>
      <h5> Email: {email} </h5>
      <h5> Add a Profile Picture:</h5>
      <input
        type="file"
        name="Profile Picture"
        accept="image/png, image/jpeg"
        placeholder="Upload a Profile Picture"
      />

      <div></div>
    </div>
  );
};

export default Profile;
