const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const newCSS = `
/* --- Mobile Utilities --- */
.kanban-board {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 24px;
  scroll-snap-type: x mandatory;
}

.kanban-column {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-snap-align: start;
}

.modal-card {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.dashboard-controls {
  display: flex;
  justify-content: space-between;
  padding-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.dashboard-controls-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .kanban-column {
    flex: 0 0 85vw;
  }
  .modal-card {
    padding: 16px !important;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .responsive-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-controls {
    flex-direction: column;
  }
  .dashboard-controls-group {
    width: 100%;
  }
  .dashboard-controls-group .btn {
    flex: 1;
    justify-content: center;
    font-size: 0.85rem;
    padding: 8px 12px;
  }
}
`;

if (!css.includes('.kanban-board')) {
  css += '\n' + newCSS;
  fs.writeFileSync('src/index.css', css);
  console.log('Appended mobile utilities to index.css');
}
