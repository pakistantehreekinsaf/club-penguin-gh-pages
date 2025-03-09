const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Initialize PeerJS (using PeerJS cloud server)
const peer = new Peer({
  host: '0.peerjs.com',
  port: 443,
  path: '/'
});

let myId;
const players = {};

// Player object
class Player {
  constructor(id, x = 400, y = 300) {
    this.id = id;
    this.x = x;
    this.y = y;
  }
}

// Handle peer connections
peer.on('open', id => {
  myId = id;
  players[myId] = new Player(myId);
  
  // Connect to room ID from URL hash
  const roomId = window.location.hash.substring(1);
  if (roomId && roomId !== myId) {
    const conn = peer.connect(roomId);
    setupConnection(conn);
  }
});

peer.on('connection', conn => {
  setupConnection(conn);
});

function setupConnection(conn) {
  conn.on('open', () => {
    conn.send({ type: 'init', id: myId, x: players[myId].x, y: players[myId].y });
  });

  conn.on('data', data => {
    if (data.type === 'move') {
      if (!players[data.id]) players[data.id] = new Player(data.id);
      players[data.id].x = data.x;
      players[data.id].y = data.y;
    }
    if (data.type === 'init') {
      players[data.id] = new Player(data.id, data.x, data.y);
    }
  });
}

// Handle movement
document.addEventListener('keydown', (e) => {
  const speed = 5;
  switch(e.key) {
    case 'ArrowUp': players[myId].y -= speed; break;
    case 'ArrowDown': players[myId].y += speed; break;
    case 'ArrowLeft': players[myId].x -= speed; break;
    case 'ArrowRight': players[myId].x += speed; break;
  }
  
  // Broadcast movement to all connected peers
  Object.keys(peer.connections).forEach(connList => {
    connList.forEach(conn => {
      conn.send({ type: 'move', id: myId, x: players[myId].x, y: players[myId].y });
    });
  });
});

// Render loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.values(players).forEach(player => {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#000080';
    ctx.fill();
  });
  requestAnimationFrame(draw);
}
draw();
