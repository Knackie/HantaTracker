fetch('data/hantavirus.json')
  .then(response => response.json())
  .then(data => {
    document.querySelector('#jsonPreview').textContent = JSON.stringify(data, null, 2);
  })
  .catch(() => {
    document.querySelector('#jsonPreview').textContent = 'Impossible de charger data/hantavirus.json';
  });
