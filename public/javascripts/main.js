function handleColorClick() {
  if (this.children[0]) {
    this.removeChild(this.children[0]);
    return;
  }
  const hexCode = this.id.split('#')[1];
  const req = new XMLHttpRequest();
	const url = 'http://www.thecolorapi.com/id?hex=' + hexCode;
  const colorClicked = this;
	req.open('GET', url, true);
  let color;
  req.addEventListener('load', function handleResponse() {
    if (this.status >= 200 && this.status < 400) {
      color = JSON.parse(this.responseText);
      const nameP = document.createElement('p');
      nameP.appendChild(document.createTextNode(color.name.value));
      nameP.classList.add('name');
      colorClicked.appendChild(nameP);
    }
  });

	req.send();

}

function main() {
  const colors = document.querySelectorAll('.color');
  colors.forEach(color => {
    color.addEventListener("click", handleColorClick);
  });
}


document.addEventListener('DOMContentLoaded', main);
