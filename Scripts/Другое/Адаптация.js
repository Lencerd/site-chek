function adjustMainPadding() {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const headerHeight = header.offsetHeight;
    main.style.paddingTop = `${headerHeight + 20}px`;
  }

  window.addEventListener('load', adjustMainPadding);
  window.addEventListener('resize', adjustMainPadding);