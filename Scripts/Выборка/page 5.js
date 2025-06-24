const toolDescriptions = {
      'бетономешалка': {
        text: 'Бетономешалка – для массового производства бетона в строительстве заводов и жилых домов',
        image: '../png/Картинки для 5 страницы/Чем строим/Бетономешалка.png'
      },
      'краска': {
        text: 'Краска для фресок – для создания пропагандистских изображений на общественных зданиях',
        image: '../png/Картинки для 5 страницы/Чем строим/Краска.png'
      },
      'арматура': {
        text: 'Арматура – металлические стержни для усиления железобетонных конструкций',
        image: '../png/Картинки для 5 страницы/Чем строим/Арматура.png'
      },
      'кран': {
        text: 'Башенный кран – для подъёма тяжёлых материалов на крупных стройках',
        image: '../png/Картинки для 5 страницы/Чем строим/Кран.png'
      }
    };
    const select = document.getElementById('toolSelect');
    const info = document.getElementById('toolInfo');
    select.addEventListener('change', () => {
      const tool = toolDescriptions[select.value];
      info.innerHTML = `<span>${tool.text}</span><img src="${tool.image}" alt="${select.value}">`;
    });
    const initialTool = toolDescriptions[select.value];
    info.innerHTML = `<span>${initialTool.text}</span><img src="${initialTool.image}" alt="${select.value}">`;
