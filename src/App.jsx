import { useState, useEffect } from 'react';
import { initialMenu } from './data/initialData';
import { Trash2, Plus, LogIn, LogOut, UtensilsCrossed, X, RefreshCw, ImagePlus, Loader2 } from 'lucide-react';

const CATEGORIAS = [
  "Desayuno/merienda",
  "Merienda libre",
  "Almuerzo"
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

  // NUEVO: Estado para saber si se está procesando una imagen
  const [uploadingImg, setUploadingImg] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    // Intentamos guardar. Si falla (por espacio), avisamos en consola.
    try {
      localStorage.setItem('menu-data', JSON.stringify(items));
    } catch (err) {
      console.error("Error guardando en localStorage (probablemente lleno por imágenes):", err);
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

  // NUEVO: Función para manejar la selección de imagen local (Base64)
  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación simple de tamaño (opcional, para evitar crashes rápidos)
    if (file.size > 2 * 1024 * 1024) { // Límite de 2MB para el prototipo
        alert("Para el prototipo, por favor usa imágenes menores a 2MB.");
        return;
    }

    setUploadingImg(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        // Cuando termina de leer, el resultado es una cadena Base64 larga
        setNuevoPlato({ ...nuevoPlato, imagen: reader.result });
        setUploadingImg(false);
    };
  };

  const agregarPlato = (e) => {
    e.preventDefault();
    if(uploadingImg) return; // Evitar guardar si la imagen sigue cargando

    const id = Date.now();
    // Usar imagen por defecto si no se cargó ninguna
    const imgFinal = nuevoPlato.imagen || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    
    setItems([...items, { ...nuevoPlato, id, precio: Number(nuevoPlato.precio), imagen: imgFinal }]);
    
    // Limpiar formulario
    setNuevoPlato({ nombre: '', descripcion: '', precio: '', categoria: CATEGORIAS[0], imagen: '' });
    // Resetear el input de archivo (truco para limpiar el nombre del archivo seleccionado)
    document.getElementById('fileInputHtml').value = ""; 
    alert("¡Plato agregado!");
  };

  const resetearDatos = () => {
    if(window.confirm('Esto restaurará el menú de ejemplo. ¿Seguro?')) {
      setItems(initialMenu);
      localStorage.removeItem('menu-data');
    }
  };

  const itemsVisibles = filtro === 'Todos' ? items : items.filter(i => i.categoria === filtro);

  return (
    <div className="min-h-screen pb-20 font-sans relative bg-[#fdfbf7]">
      
      {/* BARRA SUPERIOR ADMIN */}
      {isAdmin && (
        <div className="bg-orange-600 text-white p-2 text-center text-sm font-bold flex justify-between px-4 items-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span>🛠️ ADMIN</span>
            <button onClick={resetearDatos} className="bg-orange-700 p-1 rounded hover:bg-orange-800 text-xs flex gap-1 items-center" title="Restaurar datos de fábrica">
               <RefreshCw size={12}/> Reset
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 bg-orange-800 px-3 py-1 rounded hover:bg-orange-900 text-xs">
            <LogOut size={14} /> Salir
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="relative h-56 bg-slate-900 flex items-end">
        <img 
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1400&q=80" 
          alt="Restaurante" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 p-6 w-full text-white bg-gradient-to-t from-black/80 to-transparent">
          <h1 className="text-3xl font-bold mb-1">Liens Café</h1>
          <p className="text-gray-300 text-sm flex items-center gap-2">
             <UtensilsCrossed size={16} /> Carta Digital
          </p>
        </div>
      </header>

      {/* NAVEGACIÓN */}
      <div className="sticky top-0 z-40 bg-[#fdfbf7]/95 backdrop-blur-sm shadow-sm py-3 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="flex gap-2">
          <button onClick={() => setFiltro('Todos')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtro === 'Todos' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>Todos</button>
          {CATEGORIAS.map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtro === cat ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* LISTA DE PLATOS */}
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {itemsVisibles.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex h-28 relative">
            <div className="w-28 h-full bg-gray-100 flex-shrink-0">
              <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 leading-tight pr-2">{item.nombre}</h3>
                    <span className="font-bold text-orange-700">${item.precio.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descripcion}</p>
              </div>
              <div className="flex justify-between items-end mt-1">
                <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded-full uppercase tracking-wide font-semibold">
                  {item.categoria}
                </span>
                {isAdmin && (
                  <button onClick={() => eliminarPlato(item.id)} className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* FORMULARIO AGREGAR (NUEVO DISEÑO CON INPUT FILE) */}
      {isAdmin && (
        <section className="mt-6 p-5 bg-white border-t border-orange-100/50 mx-4 rounded-2xl shadow-xl mb-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
            <Plus className="text-orange-600 bg-orange-100 p-1 rounded-lg" size={28} /> Nuevo Plato
          </h3>
          
          <form onSubmit={agregarPlato} className="space-y-4">
            
            {/* NUEVO: Selector de Imagen con Previsualización */}
            <div className="flex items-center gap-4 mb-2 p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                {/* Previsualización o Icono */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative flex-shrink-0">
                    {uploadingImg ? (
                        <Loader2 className="animate-spin text-orange-500" />
                    ) : nuevoPlato.imagen ? (
                        <img src={nuevoPlato.imagen} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <ImagePlus className="text-gray-400" size={24} />
                    )}
                </div>
                
                {/* Input type file (oculto pero funcional) */}
                <div className="flex-grow">
                  <label htmlFor="fileInputHtml" className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">Foto del plato</label>
                  <input 
                      id="fileInputHtml"
                      type="file" 
                      accept="image/*" 
                      onChange={handleImagePick}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                  />
                   <p className="text-xs text-gray-400 mt-1">Recomendado: JPG/PNG menos de 2MB (Prototipo)</p>
                </div>
            </div>

            <div className="space-y-3">
                <input required placeholder="Nombre del plato (Ej. Tostado Completo)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                value={nuevoPlato.nombre} onChange={e => setNuevoPlato({...nuevoPlato, nombre: e.target.value})} />
                
                <textarea required placeholder="Descripción corta (ingredientes...)" rows="2" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all resize-none" 
                value={nuevoPlato.descripcion} onChange={e => setNuevoPlato({...nuevoPlato, descripcion: e.target.value})} />
                
                <div className="flex gap-3">
                <div className="relative w-1/2">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input required type="number" placeholder="Precio" className="w-full p-3 pl-7 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-semibold" 
                        value={nuevoPlato.precio} onChange={e => setNuevoPlato({...nuevoPlato, precio: e.target.value})} />
                </div>
                
                <select className="w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all appearance-none"
                    value={nuevoPlato.categoria} onChange={e => setNuevoPlato({...nuevoPlato, categoria: e.target.value})}>
                    {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                </div>
            </div>
            
            <button type="submit" disabled={uploadingImg} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${uploadingImg ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:shadow-xl active:scale-95'}`}>
              {uploadingImg ? 'Procesando imagen...' : 'Guardar Plato en el Menú'}
            </button>
          </form>
        </section>
      )}

      {/* FOOTER */}
      {!isAdmin && (
        <footer className="text-center py-8 text-gray-400 text-sm">
          <p>© 2025 LIENS SALTA</p>
          <button onClick={() => setShowLogin(true)} className="mt-4 mx-auto text-xs text-orange-600/70 hover:text-orange-600 bg-orange-50 px-4 py-2 rounded-full flex items-center justify-center gap-1 transition-colors">
            <LogIn size={14} /> Acceso Dueño
          </button>
        </footer>
      )}

      {/* MODAL LOGIN */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <button onClick={() => setShowLogin(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="text-orange-600" size={28}/>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Acceso Admin</h2>
                <p className="text-gray-500 text-sm mt-1">Gestiona tu menú digital</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">Usuario</label>
                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all"
                    value={user} onChange={(e) => setUser(e.target.value)} placeholder="Ej: admin" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">Contraseña</label>
                <input type="password" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white transition-all"
                    value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Ej: 1234" />
              </div>
              {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl text-center font-medium flex items-center justify-center gap-2"><X size={14}/>{error}</div>}
              <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-transform active:scale-95 shadow-xl mt-2">Ingresar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;