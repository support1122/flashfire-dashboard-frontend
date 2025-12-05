import axios from 'axios';

const handleGoogleSuccess = async (credentialResponse) => {
  const { credential } = credentialResponse;

  try {
    let res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/googleOAuth`, {
      token: credential,
    });
    // save res.data.token + res.data.user
  } catch (err) {
    console.error(err);
  }
};
