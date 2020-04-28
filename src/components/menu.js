function openNav() {
  const container = document.querySelector('.container');
  const visualizerContainer = document.querySelector('.visualizer-container');
  const menu = document.querySelector('.menu');
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
  menu.style.width = '250px';
  menu.style.padding = '16px';
  menu.style.paddingTop = '52px';
  visualizerContainer.style.marginLeft = '250px';
  window.menuOpened = true;
};

function closeNav() {
  const container = document.querySelector('.container');
  const visualizerContainer = document.querySelector('.visualizer-container');
  const menu = document.querySelector('.menu');
  container.style.backgroundColor = 'transparent'
  menu.style.width = '0px';
  menu.style.padding = '0px';
  menu.style.paddingTop = '52px';
  visualizerContainer.style.marginLeft = '0px';
  window.menuOpened = false;
};