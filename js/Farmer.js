// ── NAVIGATION ────────────────────────────────────────────
function goTo(pageId){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+pageId)?.classList.add('active');
  document.querySelectorAll('#sidebar .side-menu li').forEach(li=>{
    li.classList.toggle('active', li.dataset.page===pageId);
  });
}

document.querySelectorAll('#sidebar .side-menu li').forEach(li=>{
  li.addEventListener('click',e=>{
    e.preventDefault();
    if(li.dataset.page) goTo(li.dataset.page);
  });
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────
document.getElementById('menuToggle').addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ── DARK MODE ─────────────────────────────────────────────
const darkToggle=document.getElementById('darkToggle');
darkToggle.addEventListener('click',()=>{
  darkToggle.classList.toggle('on');
  document.body.classList.toggle('dark');
});

// ── TODO ──────────────────────────────────────────────────
document.getElementById('addTodoBtn').addEventListener('click',()=>{
  document.getElementById('addTodoModal').classList.add('open');
});

function addTodo(){
  const val=document.getElementById('newTodoInput').value.trim();
  if(!val)return;
  const li=document.createElement('div');
  li.className='todo-item pending-t';
  li.innerHTML=`<input type="checkbox" class="todo-cb"><span class="todo-text">${val}</span><i class='bx bx-dots-vertical-rounded todo-more'></i>`;
  li.querySelector('.todo-cb').addEventListener('change',function(){
    li.classList.toggle('done',this.checked);
    li.classList.toggle('pending-t',!this.checked);
    li.querySelector('.todo-text').style.textDecoration=this.checked?'line-through':'none';
    li.querySelector('.todo-text').style.color=this.checked?'var(--muted)':'var(--dark)';
  });
  document.getElementById('todoList').appendChild(li);
  document.getElementById('newTodoInput').value='';
  document.getElementById('addTodoModal').classList.remove('open');
}

// existing checkboxes
document.querySelectorAll('.todo-cb').forEach(cb=>{
  cb.addEventListener('change',function(){
    const item=this.closest('.todo-item');
    item.classList.toggle('done',this.checked);
    item.classList.toggle('pending-t',!this.checked);
  });
});

// ── CHAT ──────────────────────────────────────────────────
function sendMsg(){
  const inp=document.getElementById('chatInput');
  const val=inp.value.trim();
  if(!val)return;
  const body=document.querySelector('.msg-chat-body');
  const b=document.createElement('div');
  b.className='bubble sent';
  b.textContent=val;
  body.appendChild(b);
  body.scrollTop=body.scrollHeight;
  inp.value='';
}
document.getElementById('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter')sendMsg();});

// msg list item click
document.querySelectorAll('.msg-item').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.msg-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
  });
});

// ── CLOSE MODAL ON OVERLAY CLICK ──────────────────────────
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');});
});

// responsive auto-collapse
if(window.innerWidth<768){
  document.getElementById('sidebar').classList.add('collapsed');
}
window.addEventListener('resize',()=>{
  if(window.innerWidth<768){
    document.getElementById('sidebar').classList.add('collapsed');
  }
});
