function main() {
  const password = document.querySelector('#password');
  const username = document.querySelector('#username');
  const submit = document.querySelector('#submit');

  submit.addEventListener('click', (evt) => {
    if (password.value === '' || username.value === '') {
      evt.preventDefault();
      const checkError = document.querySelector('.validation');

      if (!checkError) {
        const error = document.createElement('p');
        error.classList.add('validation');
        error.appendChild(document.createTextNode('Cannot enter empty password or username.'));
        document.body.appendChild(error);
      }
    }
  });
}


document.addEventListener('DOMContentLoaded', main);
