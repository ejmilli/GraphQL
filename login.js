const URLToSignIn = `https://01.gritlab.ax/api/auth/signin`;


document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const login = document.getElementById('login-name-text').value.trim();
  const password = document.getElementById('login-password-text').value;
  const encode = btoa(`${login}:${password}`);
    

  const response = fetch(URLToSignIn, {
    method: "POST",
    headers : {
     Authorization:`Basic ${encode}`}
     
  })

  if (!response.ok) {
      alert("Failed to login")
      return 
  }

  


});