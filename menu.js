function openNav() {
  const visualizerContainer = document.querySelector('.visualizer-container');
  document.querySelector('.menu').style.width = '250px';
  visualizerContainer.style.marginLeft = '250px';
};

function closeNav() {
  const visualizerContainer = document.querySelector('.visualizer-container');
  document.querySelector('.menu').style.width = '0px';
  visualizerContainer.style.marginLeft = '0px';
};