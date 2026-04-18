import { useState, useEffect } from 'react';
import { initialMenu } from './data/initialData';
import { Trash2, Plus, LogIn, LogOut, UtensilsCrossed, X, RefreshCw, ImagePlus, Loader2, Pencil, ShoppingCart, Minus, Copy, Check } from 'lucide-react';

const CATEGORIAS = [
  "Clásicas",
  "Premium",
  "Acompañamientos",
  "Bebidas"
];

function App() {
  // --- ESTADOS ---
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('menu-data');
    return saved ? JSON.parse(saved) : initialMenu;
  });
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('menu-admin-session') === 'true';
  });

  const [showLogin, setShowLogin] = useState(false);
  const [filtro, setFiltro] = useState('Todos');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  // Estado para nuevo plato
  const [nuevoPlato, setNuevoPlato] = useState({
    nombre: '', descripcion: '', precio: '', categoria: CATEGORIAS[0], imagen: ''
  });

  // Estado para saber si se está procesando una imagen
  const [uploadingImg, setUploadingImg] = useState(false);

  // Estado para el plato que se está editando (null = ninguno)
  const [editandoPlato, setEditandoPlato] = useState(null);
  const [uploadingImgEdit, setUploadingImgEdit] = useState(false);

  // --- CARRITO ---
  const [carrito, setCarrito] = useState([]);
  const [showCarrito, setShowCarrito] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    try {
      localStorage.setItem('menu-data', JSON.stringify(items));
    } catch (err) {
      console.error("Error guardando en localStorage:", err);
      alert("Memoria llena. Para el prototipo, usa imágenes más pequeñas.");
    }
  }, [items]);

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('menu-admin-session', 'true');
    } else {
      localStorage.removeItem('menu-admin-session');
    }
  }, [isAdmin]);

  // --- FUNCIONES ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === '1234') {
      setIsAdmin(true);
      setShowLogin(false);
      setError('');
      setUser('');
      setPass('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  const eliminarPlato = (id) => {
    if(window.confirm('¿Seguro que quieres borrar este plato?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Para el prototipo, por favor usa imágenes menores a 2MB.");
        return;
    }

    setUploadingImg(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        setNuevoPlato({ ...nuevoPlato, imagen: reader.result });
        setUploadingImg(false);
    };
  };

  const agregarPlato = (e) => {
    e.preventDefault();
    if(uploadingImg) return;

    const id = Date.now();
    const imgFinal = nuevoPlato.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    
    setItems([...items, { ...nuevoPlato, id, precio: Number(nuevoPlato.precio), imagen: imgFinal }]);
    
    setNuevoPlato({ nombre: '', descripcion: '', precio: '', categoria: CATEGORIAS[0], imagen: '' });
    document.getElementById('fileInputHtml').value = ""; 
    alert("¡Plato agregado!");
  };

  const handleImagePickEdit = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Para el prototipo, por favor usa imágenes menores a 2MB.");
      return;
    }
    setUploadingImgEdit(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setEditandoPlato({ ...editandoPlato, imagen: reader.result });
      setUploadingImgEdit(false);
    };
  };

  const guardarEdicion = (e) => {
    e.preventDefault();
    if (uploadingImgEdit) return;
    setItems(items.map(item =>
      item.id === editandoPlato.id
        ? { ...editandoPlato, precio: Number(editandoPlato.precio) }
        : item
    ));
    setEditandoPlato(null);
  };

  const agregarAlCarrito = (item) => {
    setCarrito(prev => {
      const existe = prev.find(c => c.id === item.id);
      if (existe) {
        return prev.map(c => c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      }
      return [...prev, { id: item.id, nombre: item.nombre, precio: item.precio, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev =>
      prev
        .map(c => c.id === id ? { ...c, cantidad: c.cantidad + delta } : c)
        .filter(c => c.cantidad > 0)
    );
  };

  const totalCarrito = carrito.reduce((acc, c) => acc + c.precio * c.cantidad, 0);
  const cantidadTotal = carrito.reduce((acc, c) => acc + c.cantidad, 0);

  const copiarPedido = () => {
    const lineas = carrito.map(c => `• ${c.nombre} x${c.cantidad} — $${(c.precio * c.cantidad).toLocaleString()}`).join('\n');
    const texto = `🛒 *Pedido - Katz Burguer*\n\n${lineas}\n\n*Total: $${totalCarrito.toLocaleString()}*`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const resetearDatos = () => {
    if(window.confirm('Esto restaurará el menú de ejemplo. ¿Seguro?')) {
      setItems(initialMenu);
      localStorage.removeItem('menu-data');
    }
  };

  const itemsVisibles = filtro === 'Todos' ? items : items.filter(i => i.categoria === filtro);

  return (
    <div className="min-h-screen pb-20 font-sans relative bg-zinc-950 text-zinc-100">
      
      {/* BARRA SUPERIOR ADMIN */}
      {isAdmin && (
        <div className="bg-zinc-900 border-b border-zinc-800 text-amber-500 p-2 text-center text-sm font-bold flex justify-between px-4 items-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span>🛠️ ADMIN</span>
            <button onClick={resetearDatos} className="bg-zinc-800 border border-zinc-700 p-1 px-2 rounded hover:bg-zinc-700 text-zinc-300 text-xs flex gap-1 items-center transition-colors" title="Restaurar datos de fábrica">
               <RefreshCw size={12}/> Reset
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded hover:bg-zinc-700 text-zinc-300 text-xs transition-colors">
            <LogOut size={14} /> Salir
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="relative h-64 bg-black flex items-end">
        <img 
          src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1400&auto=format&fit=crop" 
          alt="Katz Burguer" 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
        <div className="relative z-10 p-6 w-full text-white">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 uppercase">Katz Burguer</h1>
          <p className="text-amber-500 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
             <UtensilsCrossed size={16} /> Premium Burgers
          </p>
        </div>
      </header>

      {/* NAVEGACIÓN */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50 py-3 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex gap-2">
          <button onClick={() => setFiltro('Todos')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filtro === 'Todos' ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 font-bold' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'}`}>Todos</button>
          {CATEGORIAS.map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filtro === cat ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 font-bold' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* LISTA DE PLATOS */}
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {itemsVisibles.map(item => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex h-32 relative">
            <div className="w-32 h-full bg-zinc-800 flex-shrink-0">
              <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="p-3.5 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-zinc-100 leading-tight pr-2 text-lg">{item.nombre}</h3>
                    <span className="font-black text-amber-500 text-lg">${item.precio.toLocaleString()}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{item.descripcion}</p>
              </div>
              <div className="flex justify-between items-end mt-1">
                <span className="inline-block px-2.5 py-0.5 bg-zinc-800 border border-zinc-700/50 text-amber-500 text-[10px] rounded-full uppercase tracking-wider font-bold">
                  {item.categoria}
                </span>
                {isAdmin ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditandoPlato({ ...item })} className="p-1.5 bg-zinc-800 text-blue-400 border border-zinc-700 rounded-full hover:bg-zinc-700 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => eliminarPlato(item.id)} className="p-1.5 bg-zinc-800 text-red-400 border border-zinc-700 rounded-full hover:bg-zinc-700 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => agregarAlCarrito(item)} className="p-1.5 bg-amber-500 text-zinc-950 rounded-full hover:bg-amber-400 active:scale-90 transition-all shadow-md">
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* FORMULARIO AGREGAR */}
      {isAdmin && (
        <section className="mt-6 p-5 bg-zinc-900 border border-zinc-800 mx-4 rounded-2xl shadow-xl mb-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-100">
            <Plus className="text-amber-500 bg-zinc-800 p-1.5 rounded-lg border border-zinc-700" size={30} /> Nuevo Plato
          </h3>
          
          <form onSubmit={agregarPlato} className="space-y-4">
            
            <div className="flex items-center gap-4 mb-2 p-3 bg-zinc-950 rounded-xl border border-dashed border-zinc-800">
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative flex-shrink-0">
                    {uploadingImg ? (
                        <Loader2 className="animate-spin text-amber-500" />
                    ) : nuevoPlato.imagen ? (
                        <img src={nuevoPlato.imagen} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <ImagePlus className="text-zinc-600" size={24} />
                    )}
                </div>
                
                <div className="flex-grow">
                  <label htmlFor="fileInputHtml" className="block text-sm font-medium text-zinc-300 mb-1 cursor-pointer">Foto del plato</label>
                  <input 
                      id="fileInputHtml"
                      type="file" 
                      accept="image/*" 
                      onChange={handleImagePick}
                      className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-amber-500 hover:file:bg-zinc-700 file:transition-colors cursor-pointer"
                  />
                   <p className="text-xs text-zinc-600 mt-1">Sugerido: Menos de 2MB</p>
                </div>
            </div>

            <div className="space-y-3">
                <input required placeholder="Nombre del plato" className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" 
                value={nuevoPlato.nombre} onChange={e => setNuevoPlato({...nuevoPlato, nombre: e.target.value})} />
                
                <textarea required placeholder="Descripción e ingredientes" rows="2" className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none" 
                value={nuevoPlato.descripcion} onChange={e => setNuevoPlato({...nuevoPlato, descripcion: e.target.value})} />
                
                <div className="flex gap-3">
                <div className="relative w-1/2">
                    <span className="absolute left-3 top-3.5 text-zinc-500 font-bold">$</span>
                    <input required type="number" placeholder="Precio" className="w-full p-3 pl-8 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-semibold" 
                        value={nuevoPlato.precio} onChange={e => setNuevoPlato({...nuevoPlato, precio: e.target.value})} />
                </div>
                
                <select className="w-1/2 p-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all appearance-none"
                    value={nuevoPlato.categoria} onChange={e => setNuevoPlato({...nuevoPlato, categoria: e.target.value})}>
                    {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                </div>
            </div>
            
            <button type="submit" disabled={uploadingImg} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${uploadingImg ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-95 shadow-amber-500/20'}`}>
              {uploadingImg ? 'Procesando imagen...' : 'Guardar Plato'}
            </button>
          </form>
        </section>
      )}

      {/* FOOTER */}
      {!isAdmin && (
        <footer className="text-center py-10 text-zinc-600 text-sm">
          <p>© 2026 KATZ BURGUER</p>
          <button onClick={() => setShowLogin(true)} className="mt-4 mx-auto text-xs text-zinc-500 hover:text-amber-500 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-full flex items-center justify-center gap-1 transition-colors">
            <LogIn size={14} /> Acceso Dueño
          </button>
        </footer>
      )}

      {/* BOTÓN FLOTANTE CARRITO */}
      {!isAdmin && cantidadTotal > 0 && (
        <button
          onClick={() => setShowCarrito(true)}
          className="fixed bottom-6 right-4 z-40 bg-amber-500 text-zinc-950 rounded-2xl px-4 py-3 shadow-xl shadow-amber-500/20 flex items-center gap-3 hover:bg-amber-400 active:scale-95 transition-all"
        >
          <ShoppingCart size={20} />
          <span className="font-bold text-sm">Ver pedido</span>
          <span className="bg-zinc-950 text-amber-500 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center">{cantidadTotal}</span>
        </button>
      )}

      {/* MODAL CARRITO */}
      {showCarrito && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-3xl"></div>

            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <ShoppingCart className="text-amber-500" size={22} /> Tu pedido
              </h2>
              <button onClick={() => setShowCarrito(false)} className="text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 px-5 space-y-3 pb-3">
              {carrito.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-200 text-sm truncate">{c.nombre}</p>
                    <p className="text-xs text-amber-500 font-bold">${(c.precio * c.cantidad).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => cambiarCantidad(c.id, -1)} className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center active:scale-90 transition-all">
                      <Minus size={12} />
                    </button>
                    <span className="font-bold text-sm w-4 text-center text-zinc-100">{c.cantidad}</span>
                    <button onClick={() => cambiarCantidad(c.id, 1)} className="w-7 h-7 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 flex items-center justify-center active:scale-90 transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-5 pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex justify-between items-center font-bold text-zinc-100">
                <span>Total</span>
                <span className="text-xl text-amber-500">${totalCarrito.toLocaleString()}</span>
              </div>
              <button
                onClick={copiarPedido}
                className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${copiado ? 'bg-green-600 text-white' : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-95 shadow-amber-500/20'}`}
              >
                {copiado ? <><Check size={18} /> ¡Copiado para WhatsApp!</> : <><Copy size={18} /> Copiar pedido</>}
              </button>
              <button onClick={() => setCarrito([])} className="w-full py-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PLATO */}
      {editandoPlato && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-t-3xl"></div>
            <button onClick={() => setEditandoPlato(null)} className="absolute top-5 right-5 text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <Pencil className="text-amber-500 bg-zinc-800 border border-zinc-700 p-1.5 rounded-lg" size={28} /> Editar Plato
            </h2>

            <form onSubmit={guardarEdicion} className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl">
                <div className="w-16 h-16 bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-zinc-800">
                  {uploadingImgEdit ? (
                    <Loader2 className="animate-spin text-amber-500" />
                  ) : editandoPlato.imagen ? (
                    <img src={editandoPlato.imagen} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlus className="text-zinc-600" size={20} />
                  )}
                </div>
                <div className="flex-grow">
                  <label htmlFor="fileInputEdit" className="block text-sm font-medium text-zinc-300 mb-1 cursor-pointer">Cambiar foto</label>
                  <input
                    id="fileInputEdit"
                    type="file"
                    accept="image/*"
                    onChange={handleImagePickEdit}
                    className="block w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-amber-500 hover:file:bg-zinc-700 cursor-pointer transition-colors"
                  />
                </div>
              </div>

              <input required placeholder="Nombre del plato" className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                value={editandoPlato.nombre} onChange={e => setEditandoPlato({ ...editandoPlato, nombre: e.target.value })} />

              <textarea required placeholder="Descripción" rows="2" className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                value={editandoPlato.descripcion} onChange={e => setEditandoPlato({ ...editandoPlato, descripcion: e.target.value })} />

              <div className="flex gap-3">
                <div className="relative w-1/2">
                  <span className="absolute left-3 top-3.5 text-zinc-500 font-bold">$</span>
                  <input required type="number" placeholder="Precio" className="w-full p-3 pl-8 bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-semibold"
                    value={editandoPlato.precio} onChange={e => setEditandoPlato({ ...editandoPlato, precio: e.target.value })} />
                </div>
                <select className="w-1/2 p-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all appearance-none"
                  value={editandoPlato.categoria} onChange={e => setEditandoPlato({ ...editandoPlato, categoria: e.target.value })}>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={uploadingImgEdit} className={`w-full py-3.5 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${uploadingImgEdit ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 active:scale-95 shadow-amber-500/20'}`}>
                {uploadingImgEdit ? 'Procesando imagen...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <button onClick={() => setShowLogin(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-white bg-zinc-800 p-1.5 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="text-center mb-6 mt-2">
                <div className="bg-zinc-800 border border-zinc-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="text-amber-500" size={28}/>
                </div>
                <h2 className="text-2xl font-bold text-white">Acceso Admin</h2>
                <p className="text-zinc-400 text-sm mt-1">Gestión Katz Burguer</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Usuario</label>
                <input type="text" className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    value={user} onChange={(e) => setUser(e.target.value)} placeholder="Ej: admin" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-400 ml-1">Contraseña</label>
                <input type="password" className="w-full p-3 bg-zinc-950 border border-zinc-800 text-white rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Ej: 1234" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center font-medium flex items-center justify-center gap-2"><X size={14}/>{error}</div>}
              <button type="submit" className="w-full bg-amber-500 text-zinc-950 py-4 rounded-xl font-bold text-lg hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20 mt-4">Ingresar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;