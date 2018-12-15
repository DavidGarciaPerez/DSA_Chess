let usuarios = [];

function generateRoomId() {
    let result = "";
    let length = 16;
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-@";

    for (let i = 0; i < length; i++)
        result += possible.charAt(Math.floor(Math.random() * possible.length));

    return result;
}

//servidor preparado a la escucha de las peticiones:
exports = module.exports = function(io){
    io.on('connection', (socket) => {

        socket.on("disconnect", usuarioDesconectado);
        socket.on("move", broadcastMove);
        socket.on("sendMessage", sendMessage);
        socket.on("sendUserName", sendUserName);
        socket.on("agregarUsuarioConectado", agregarUsuarioConectado);
        socket.on("nuevoJuego",nuevoJuego);
        socket.on("buscarContrincante",buscarContrincante);
        socket.on("invitarUsuarioAPartida",invitarUsuarioAPartida);
        socket.on("joinRoom",joinRoom);
        socket.on("pararCronometroContrincante",pararCronometroContrincante);
        socket.on("setTiempoElegido",setTiempoElegido);
        socket.on("enJaque",enJaque);

        //Para mandar al otro usuario y decirle que está en jaque:
        function enJaque(room, id, isJaque) {
            var arrayLength = usuarios.length;
            for (var i = 0; i < arrayLength; i++) {
                if(usuarios[i].room === room && usuarios[i].id !== id){
                    io.to(usuarios[i].id).emit("isJaque", isJaque);
                }
            }
        }

        //Para mandar el tiempo que ha elejido uno de los usuarios a la partida que se va a jugar entre los dos:
        function setTiempoElegido(room, time) {
            var arrayLength = usuarios.length;
            for (var i = 0; i < arrayLength; i++) {
                if(usuarios[i].room === room){
                    io.to(usuarios[i].id).emit("getTiempoElejido",time);
                }
            }
        }
        
        //Para invitar al usuario a la partida que le ha invitado otro:
        //usuario = usuario al que vamos a invitar
        function invitarUsuarioAPartida(usuarioEmisor, usuarioReceptor) {
            //Mandamos petición al usuario con el id = socket suyo:
            io.to(usuarioReceptor.id).emit("getInvitacion",usuarioEmisor, usuarioReceptor);
        }

        //Para buscar si hay algúnn usuario disponible para jugar:
        function buscarContrincante(lessThis) {
            var jugadorEncontrado = false;
            var index = 0;
            var arrayLength = usuarios.length;
            for (var i = 0; i < arrayLength; i++) {
                //Si encontramos a los usuarios les ponemos la room:
                if(usuarios[i].isPlaying === false && usuarios[i].username !== lessThis){
                   jugadorEncontrado = true;
                   index = i;
                   break;
                }
            }

            socket.emit("getContrincante",{jugadorEncontrado : jugadorEncontrado, usuario: usuarios[index]});
        }

        //Para crear una sala:
        function joinRoom(room) {
            //Preparamos partida y metemos al jugador a una sala con dicha room:
            socket.join(room);
        }

        //Para crear un nuevo juego entre 2 usuarios:
        function nuevoJuego(usuario1, usuario2){
            //Creamos una room para los dos:
            let room = generateRoomId();
            let usuarioWhite = null;
            let usuarioBlack = null;
            //Recorremos array usuarios para poner dichar room:
            let arrayLength = usuarios.length;

            for (let i = 0; i < arrayLength; i++) {
                //Si encontramos a los usuarios les ponemos la room:
                if(usuarios[i].username === usuario1.username){
                    usuarioWhite = usuarios[i];
                }else if(usuarios[i].username === usuario2.username){
                    usuarioBlack = usuarios[i];
                }
            }

            for (let i = 0; i < arrayLength; i++) {
                //Si encontramos a los usuarios les ponemos la room:
                if(usuarios[i].username === usuario1.username){
                    //Ponemos la room al usuario 1:
                    usuarios[i].room = room;
                    usuarios[i].isPlaying = true;
                    //Mandamos el id room al cliente:
                    io.to(usuarios[i].id).emit("getRoom",room);
                    io.to(usuarios[i].id).emit("comenzarJuego","white", {usuarioWhite : usuarioWhite, usuarioBlack : usuarioBlack});
                }else if(usuarios[i].username === usuario2.username){
                    //Ponemos la room al usuario 2:
                    usuarios[i].room = room;
                    usuarios[i].isPlaying = true;
                    //Mandamos el id room al cliente:
                    io.to(usuarios[i].id).emit("getRoom",room);
                    io.to(usuarios[i].id).emit("comenzarJuego","black", {usuarioWhite : usuarioWhite, usuarioBlack : usuarioBlack});
                }
            }
        }

        //Para mandar el movimiento de la pieza:
        function broadcastMove(moveData, myRoom) {
            //Lo enviamos con la persona que estemos jugando:
            socket.broadcast.emit("move",moveData, myRoom);
        }

        //Para parar el cronómetro del contrincante:
        function pararCronometroContrincante(room, id) {
            let arrayLength = usuarios.length;
            for (let i = 0; i < arrayLength; i++) {
                if(usuarios[i].room === room && usuarios[i].id !== id){
                    //Paramos su cronómetro:
                    io.to(usuarios[i].id).emit("pararCronometro");
                }
            }
        }

        //Cuando el servidor recive un mensaje del usuario:
        function sendMessage(data) {
            //Hacemos que el servidor emita el mensaje hacia todos los clientes
            //para que se sincronicen:
            socket.broadcast.emit("sendMessage", {mensaje: data.mensaje, username: data.username});
        }

        //Cuando el servidor recive el nombre del usuario, nombre y apellidos:
        function sendUserName(data) {
            let room = generateRoomId();
            //Guardamos usuario en una lista:
            usuarios.push({
                id: socket.id,
                username: data.username,
                nombre: data.nombre,
                apellidos: data.apellidos,
                icon: data.icon,
                tiempoJugado: null,
                partidasGanadas: 0,
                partidasPerdidas: 0,
                room: room,
                isPlaying: false,
                elo: 1500
            });

            //Enviamos al cliente su sockedID:
            socket.emit("setSocketID",socket.id);

            //Enviamos al cliente la acutalización de posbiles nuevos usuarios conectados:
            socket.emit("actualizarListaUsuariosConectados", usuarios);

            //Enviamos a los clientes que hay un nuevo usuarios online conectado:
            io.emit("usuariosOnline",usuarios.length);
        }

        //Para hacer broadcast del nuevo usuario conectado con todos los demás:
        function agregarUsuarioConectado(data) {
            //Hacemos broadcast a todos menos al que lo ha enviado:
            socket.broadcast.emit("agregarUsuarioConectado", data);
        }

        function usuarioDesconectado() {
            //Cuando se desconecta un usuario lo quitamos de la lista:
            let arrayLength = usuarios.length;
            if(arrayLength > 0) {
                for (let i = 0; i < arrayLength; i++) {
                    //Antes de crear una nueva fila de un usuarios conectado tenemos que comprobar su socketID:
                    if(usuarios[i]!==null) {
                        if (usuarios[i].id === socket.id) {
                            console.log("Server -> Usuario desconectado: " + usuarios[i].username);
                            //Remmovemos usuario:
                            usuarios.splice(i, 1); // 1 = removemos solo ese
                            console.log("Server -> usuarios.size = " + usuarios.length);

                            //Actualizamos los usuarios conectados online en -1:
                            io.emit("usuariosOnline",usuarios.length);
                        }
                    }
                }
            }
        }
    })
};