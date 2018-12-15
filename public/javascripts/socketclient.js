// función por defecto del cliente:
function Socketclient(){

	// id's HTML del chat:
    let messages = $("#messages");
    let chatBox = $("#chatBox");
    let chat = $("#chat");

    // id's HTML del cliente:
    //variables para obtener valores:
    let username = $("#username");//donde se escribe el nombre usuario a mandar
    let apellidos = $("#apellidos");//donde se escribe los apellidos a mandar
    let nombre = $("#nombre");//donde se escribe el nombre del cliente a mandar
    let sendUserName = $("#sendUserName");//donde se escribe el mensaje a mandar

    //variables para guardar valores:
    let userNameChatInput = $("#userNameChatSpan");//para mostrar el nombre de usuario en el input del mensaje
    let userLabel = $("#userLabel");//para mostrar el username en pantalla
    let tiempoLabel = $("#tiempoLabel");//para mostrar el tiempo que lleva jugando
    let cpuActive = $("#cpuActive");//para mostrar si está activa la cpu
    let cpuNivel = $("#cpuNivel");//para mostrar el nivel de dificultad de la cpu
    let eloUsuario = $("#eloUsuario");
    let partidasPerdidasLabel = $("#partidasPerdidasLabel");
    let partidasGanadasLabel = $("#partidasGanadasLabel");
    let usuariosOnline = $("#usuariosOnline");

    let tablaUsuarios = $("#tablaUsuarios");
    let tablaUsuariosConectados =  null;

    //Botones usuario menu:
    let buttonCpu = $("#buttonCpu");
    //Slider usuario menu:
    let sliderCpu = $("#sliderCpuNivel");

    //PlayerOptions MODAL:
    let buttonTime1  = $("#buttonPlayerOptionTime1"); //1m
    let buttonTime2  = $("#buttonPlayerOptionTime2"); //3m
    let buttonTime3  = $("#buttonPlayerOptionTime3"); //5m
    let buttonTime4  = $("#buttonPlayerOptionTime4"); //10m
    let buttonTime5  = $("#buttonPlayerOptionTime5"); //15m
    let buttonContrincante = $("#jugarContraAlquien");
    let sliderPlayerOptionMaxElo = $("#sliderPlayerOptionMaxElo");
    let PlayerOptionChooseTime = $("#PlayerOptionChooseTime");
    let PlayerOptionChooseElo = $("#PlayerOptionChooseElo");

    //Cuando van a jugar una partida online:
    let eloPlayer1 = $("#eloPlayer1");
    let iconPlayer1 = $("#iconPlayer1");
    let player1 = $("#player1");
    let eloPlayer2 = $("#eloPlayer2");
    let iconPlayer2 = $("#iconPlayer2");
    let player2 = $("#player2");
    let miCronometro = $("#timePlayer1"); //El cronómetro de este usuario
    let suCronometro = $("#timePlayer2"); //El cronómetro del otro usuario
    $("#enJaqueLabel").hide();

	//Conectamos el cliente:
    let socket = io.connect();

    let usernameValue = null;
    let nombreValue = null;
    let emailValue = null;
    let profileIconURLValue = "http://icons.iconarchive.com/icons/saviourmachine/chat/256/online-icon.png";
    let elo = 1500;

    let misSegundos = 0;
    let misMinutos = 0;
    let susSegundos = 0;
    let susMinutos = 0;
    let pararMiCronometro = false;
    let pararSuCronometro = false;

    let board;
    let jugadorEncontrado = false;
    let mySocketID = null;
    let myRoom = null;
    let tiempoElegido = 1;
    let eloElegido = 1500;

    //Para recivir mensajes del servidor: mensajes de otros usuarios
    socket.on("sendMessage", sendMessage);
    socket.on("move",move);
    socket.on("agregarUsuarioConectado",agregarUsuarioConectado);
    socket.on("actualizarListaUsuariosConectados",actualizarListaUsuariosConectados);
    socket.on("setSocketID",getSocketID);
    socket.on("getContrincante",getContrincante);
    socket.on("getInvitacion",getInvitacion);
    socket.on("comenzarJuego",comenzarJuego);
    socket.on("getRoom",getRoom);
    socket.on("usuariosOnline", mostrarUsuariosOnline);
    socket.on("pararCronometro",stopCronometro);
    socket.on("getTiempoElejido",getTiempoElejido);
    socket.on("isJaque",isJaque);

    //Para mandar mensaje al servidor:
    chatBox.submit(function(){
    	if (usernameValue == null) {
    		//Creamos alerta:
            $("#Alert").modal();
            $("#alerta").text("¡Necesitas un usuario!")
    	}else{
    		//Mandamos mensaje al servidor:
        	socket.emit("sendMessage",{mensaje : chat.val(), username: usernameValue}); //cogemos el input del id="chat"
            //Creamos el mensaje del usuario, su color será diferente al de los demás usuarios:
            createMessage({mensaje : chat.val(), username: usernameValue},"#6390ff");
        	//Reiniciamos valor del input a null:
        	chat.val("");
    	}
        return false;
    });

    //Para mandar los datos del usuario al servidor:
    sendUserName.submit(function(){
        //Comprobamos primero que los campos estén con algún valor:
        if (username.val().length === 0 || nombre.val().length === 0 || apellidos.val().length === 0) {
            //Creamos alerta:
            $("#Alert").modal();
            $("#alerta").text("¡Te falta de rellenar un campo!")
        }else{
            agregarUsuarioConectadoToTable({username: username.val(), icon: profileIconURLValue});

            //Mandamos el nombre del usuario al servidor:
            socket.emit("sendUserName",{username : username.val(), nombre : nombre.val(), apellidos : apellidos.val(), icon: profileIconURLValue});
            socket.emit("agregarUsuarioConectado",{username: username.val(), icon: profileIconURLValue});

            //Mostramos los valores:
            userNameChatInput.text(username.val());
            userLabel.text(username.val());

            //Guardamos los valores:
            usernameValue = username.val();

            //Reiniciamos valor del input a null:
            username.val("");
            nombre.val("");
            apellidos.val("");
        }
        return false;
    });

    //Para jugadar contra alguien:
    buttonContrincante.click(function () {
        //Le decimos primero al servidor a ver si hay algún usuario disponible
        socket.emit("buscarContrincante", usernameValue);
    });

    //Para las opciones del player option modal:
    buttonTime1.click(function () {
        tiempoElegido = 1;
        PlayerOptionChooseTime.text("TIEMPO : "+tiempoElegido+" minuto");
    });
    buttonTime2.click(function () {
        tiempoElegido = 3;
        PlayerOptionChooseTime.text("TIEMPO : "+tiempoElegido+" minutos");
    });
    buttonTime3.click(function () {
        tiempoElegido = 5;
        PlayerOptionChooseTime.text("TIEMPO : "+tiempoElegido+" minutos");
    });
    buttonTime4.click(function () {
        tiempoElegido = 10;
        PlayerOptionChooseTime.text("TIEMPO : "+tiempoElegido+" minutos");
    });
    buttonTime5.click(function () {
        tiempoElegido = 15;
        PlayerOptionChooseTime.text("TIEMPO : "+tiempoElegido+" minutos");
    });

    sliderPlayerOptionMaxElo.change(function(){
        PlayerOptionChooseElo.text("ELO : "+sliderPlayerOptionMaxElo.val());
        eloElegido = sliderPlayerOptionMaxElo.val();
    });

    sliderPlayerOptionMaxElo.change();


	//Para jugar contra la cpu:
    buttonCpu.click(function(){
		//Activamos la cpu:
		board.setCpu(true);
        cpuActive.text("SI");
		//Ponemos dificultad de la cpu:
		board.setCpuNivel(sliderCpu.val());
        cpuNivel.text(sliderCpu.val());
    });

    $("#buscarContrincantes").click(function () {
        if (usernameValue == null) {
            //Creamos alerta:
            $("#Alert").modal();
            $("#alerta").text("¡Necesitas un usuario!")
        }else {
            //Activamos modal:
            $("#modalCenterPlayOptions").modal();
        }
    });

    let contrincante = null;
    //Para mandar petición al jugador;
    $("#mandarPeticionAJugador").click(function () {
        //Si el usuario le da a invitarle entonces mandamos invitación al usuario destino:
        socket.emit("invitarUsuarioAPartida", usernameValue, contrincante);
        //Ocultamos el botón de comenzar porque todavía no sabemos nada del otro jugador:
        $("#jugar").hide();
    });

    //Función para saber si estoy en jaque;
    function isJaque(isJaque) {
        if(isJaque) {
            $("#enJaqueLabel").show();
        }else{
            $("#enJaqueLabel").hide();
        }
    }

    //Función para recivir el tiempo elegido del otro usuario:
    function getTiempoElejido(time) {
        //Ahora ponemos el tiempo al nuestro:
        tiempoElegido = time;
    }

    //Función para parar el cronómetro cuando el otro usuario le toca mover:
    function stopCronometro() {
        //Paramos mi cronómetro:
        pararMiCronometro = true;
        //Resumen su cronómetro:
        pararSuCronometro = false;
    }

    function mostrarUsuariosOnline(usuarios) {
        if(usuarios === 1){
            usuariosOnline.text(usuarios+" USUARIO CONECTADO");
        }else if(usuarios > 1){
            usuariosOnline.text(usuarios+" USUARIOS CONECTADOS");
        }else{
            usuariosOnline.text("NINGÚN USUARIO CONECTADO");
        }
    }

    //Función para guardar la room de una sala generada por el servidor para jugar entre 2 jugadores:
    function getRoom(room) {
        myRoom = room;
    }

    //Función para comenzar el juego entre 2 jugadores, el servidor manda la orden:
    function comenzarJuego(orientation, usuarios) {
        if(orientation === "white") {
            $("#imgLoading").hide();
            $("#esperandoConfirmacion").text("¡PETICIÓN CONFIRMADA!")
            $("#jugar").show();
            $("#jugar").click(function () {
                jugadorEncontrado = true;
                //Reiniciamos board:
                board.reset();
                //Desactivamos cpu:
                board.setCpu(false);
                //La orientacion será aleatoria, a jugador le tocará una posición distinta cada vez que jueguen:
                board.setOrientation(orientation);
                //Creamos room:
                socket.emit("joinRoom", myRoom);
                console.log("Comenzando juego..." + myRoom);

                player1.text(usuarios.usuarioWhite.username);
                eloPlayer1.text(usuarios.usuarioWhite.elo);
                iconPlayer1.src = usuarios.usuarioWhite.icon;

                player2.text(usuarios.usuarioBlack.username);
                eloPlayer2.text(usuarios.usuarioBlack.elo);
                iconPlayer2.src = usuarios.usuarioBlack.icon;

                //Mandamos el tiempo elegido al otro usuario:
                socket.emit("setTiempoElegido", myRoom, tiempoElegido);

                //Iniciamos cronómetros:
                setInterval(miCronometroFunction,1000);
                setInterval(suCronometroFunction,1000);
                //Cuando al jugador le tocan las blancas tenemos que parar el croómetro rival (black)
                pararSuCronometro = true;
                pararMiCronometro = false;
            });
        }else{
            jugadorEncontrado = true;
            //Reiniciamos board:
            board.reset();
            //Desactivamos cpu:
            board.setCpu(false);
            //La orientacion será aleatoria, a jugador le tocará una posición distinta cada vez que jueguen:
            board.setOrientation(orientation);
            //Creamos room:
            socket.emit("joinRoom", myRoom);
            console.log("Comenzando juego..." + myRoom);

            player1.text(usuarios.usuarioBlack.username);
            eloPlayer1.text(usuarios.usuarioBlack.elo);
            iconPlayer1.src = usuarios.usuarioBlack.icon;

            player2.text(usuarios.usuarioWhite.username);
            eloPlayer2.text(usuarios.usuarioWhite.elo);
            iconPlayer2.src = usuarios.usuarioWhite.icon;

            //Iniciamos cronómetros:
            setInterval(miCronometroFunction,1000);
            setInterval(suCronometroFunction,1000);
            //Cuando al jugador le tocan las negras tenemos que parar nuestro cronómetro
            pararSuCronometro = false;
            pararMiCronometro = true;
        }
    }

    //Función para obtener la invitación de otro usuario que nos ha mandado el servidor:
    function getInvitacion(usuarioEmisor, usuarioReceptor) {
        //Activamos el modal:
        $("#MostrarPeticionDeJuego").modal();
        //Una vez aceptada la invitación creamos un nuevo juego entre los dos jugadores:
        $("#jugadorQueQuiereJugarContigo").text(usuarioEmisor);
        $("#confirmarPeticion").click(function () {
            let usuario1 = {username: usuarioEmisor};
            socket.emit("nuevoJuego", usuario1, usuarioReceptor);
            console.log("Invitación aceptada");
        });
    }

    //Función para obtener si hay algún contrincante que nos ha mandado el servidor:
    function getContrincante(data){
        console.log("Encontrado: "+data.jugadorEncontrado + "  Usuario: "+data.usuario.username);
        if(data.jugadorEncontrado === true){

            $("#mandarPeticionAJugador").show();
            $("#jugadorEncontradoNombre").show();
            $("#jugadorBusquedaEncontrado").text("SE HA ENCONTRADO UN JUGADOR DISPONIBLE");
            $("#jugadorEncontradoNombre").text(data.usuario.username);

            contrincante = data.usuario;
        }else{
            $("#mandarPeticionAJugador").hide();
            $("#jugadorEncontradoNombre").hide();
            $("#jugadorBusquedaEncontrado").text("NO HAY NINGÚN JUGADOR DISPONIBLE");
        }
    }

    //Función para crear el mensaje que recivirán los usuarios:
    function sendMessage(data){
        //El color del mensaje a crear será difirente para los usuarios que para el que lo manda:
        createMessage(data,"#ffbe28");
    }

    //Función para crear el prototipoo del mensaje:
    function createMessage(data, color) {
        //span para guardar el nombre de usuario:
        let span = $("<span/>",{
            class: "user-message input-group-text",
            text: data.username,
            style: "background-color: "+color+"; color: black;"
        });

        //textarea para el mensaje:
        let textArea = $("<textarea/>",{
            class: "message form-control",
            text: data.mensaje
        });

        //divisor primero:
        let firstDiv = $("<div/>",{
            class: "contenedor-mensaje input-group"
        });

        //divisor segundo:
        let secondDiv = $("<div/>",{
            class: "input-group-prepend"
        });

        //Creamos la estructura:
        firstDiv.append(secondDiv);
        firstDiv.append(textArea);
        secondDiv.append(span);
        messages.append(firstDiv);
    }

    //Función para guardar el sockerID del nuevo cliente conectado:
    function getSocketID(socketID){
        mySocketID = socketID;
        console.log("My new socket ID from server: "+socketID);
    }

    function move(moveData, room){
        if(myRoom === room) {
            board.makeMove(moveData);
            board.setPosition();
            //Paramos cronómetro del concrincante y activamos el nuestro:
            socket.emit("pararCronometroContrincante",room, mySocketID);
            pararMiCronometro = false;
            pararSuCronometro = true;
        }
    }

    function agregarUsuarioConectado(data){
        agregarUsuarioConectadoToTable(data);
    }

	function miCronometroFunction () {
        if(pararMiCronometro === false) {
            //Ahora comprobamos si los minutos han llegado al tope de minutos elegidos:
            if (misMinutos === tiempoElegido && (59 - misSegundos) === 0) {
                miCronometro.text("00:00");
                return
            }

            //Tenemos que ir restando el tiempo elegido - lo que hay en el cronómetro:
            if (misSegundos === 59) {
                //Sumamos un minuto:
                misMinutos++;
                misSegundos = 0;
            } else {
                //Sino seguimos sumando segundos:
                misSegundos++;
            }

            if ((tiempoElegido - misMinutos) < 10 && (60 - misSegundos) < 10) {
                miCronometro.text("0" + (tiempoElegido - misMinutos - 1) + ":0" + (60 - misSegundos));
            } else if ((tiempoElegido - misMinutos) < 10) {
                miCronometro.text("0" + (tiempoElegido - misMinutos - 1) + ":" + (60 - misSegundos));
            } else if ((60 - misSegundos) < 10) {
                miCronometro.text((tiempoElegido - misMinutos - 1) + ":0" + (60 - misSegundos));
            } else {
                miCronometro.text((tiempoElegido - misMinutos - 1) + ":" + (60 - misSegundos));
            }
        }
	}

    function suCronometroFunction () {
        if(pararSuCronometro === false) {
            //Ahora comprobamos si los minutos han llegado al tope de minutos elegidos:
            if (susMinutos === tiempoElegido && (59 - susSegundos) === 0) {
                suCronometro.text("00:00");
                return
            }

            //Tenemos que ir restando el tiempo elegido - lo que hay en el cronómetro:
            if (susSegundos === 59) {
                //Sumamos un minuto:
                susMinutos++;
                susSegundos = 0;
            } else {
                //Sino seguimos sumando segundos:
                susSegundos++;
            }

            if ((tiempoElegido - susMinutos) < 10 && (60 - susSegundos) < 10) {
                suCronometro.text("0" + (tiempoElegido - susMinutos - 1) + ":0" + (60 - susSegundos));
            } else if ((tiempoElegido - susMinutos) < 10) {
                suCronometro.text("0" + (tiempoElegido - susMinutos - 1) + ":" + (60 - susSegundos));
            } else if ((60 - misSegundos) < 10) {
                suCronometro.text((tiempoElegido - susMinutos - 1) + ":0" + (60 - susSegundos));
            } else {
                suCronometro.text((tiempoElegido - susMinutos - 1) + ":" + (60 - susSegundos));
            }
        }
    }


    function onSuccess(googleUser) {
        // Useful data for your client-side scripts:
        let profile = googleUser.getBasicProfile();
        //Guardamos los valores del usuario que ha iniciado sesión:
        usernameValue = profile.getGivenName();
        nombreValue = profile.getName();
        emailValue = profile.getEmail();
        profileIconURLValue = profile.getImageUrl();

        // language=JQuery-CSS
        $("#profileIcon").attr("src",profileIconURLValue);

        agregarUsuarioConectadoToTable({username: usernameValue, icon: profileIconURLValue});
        userLabel.text(usernameValue);

        socket.emit("sendUserName",{username : usernameValue, nombre : nombreValue, apellidos : null, icon: profileIconURLValue});
        socket.emit("agregarUsuarioConectado",{username: usernameValue, icon: profileIconURLValue});
    }

    function onFailure(error) {
        console.log(error);
    }

    function renderButton() {
        gapi.signin2.render('my-signin2', {
            'scope': 'https://www.googleapis.com/auth/drive.metadata.readonly',
            'width': 25,
            'height': 25,
            'longtitle': false,
            'theme': 'dark',
            'onsuccess': onSuccess,
            'onfailure': onFailure,
        });
    }

    let tablaUsuariosConectadosCreada = false;
    function agregarUsuarioConectadoToTable(data) {
        //Creamos el esqueleto de la fila a crear para insertar en la tabla de usuarios conectados:

        let name = $("<td/>", {
            text: "  " + data.username,
            class: "username"
        });

        let icon = $("<td/>", {
            align: "center",
        });

        let iconEstado = $("<td/>",{
            align: "center"
        });

        let imagen = $("<img/>", {
            src: data.icon,
            height: "24",
            width: "24",
        });

        let estado = $("<img/>",{
            src: "http://aux3.iconspalace.com/uploads/632613165.png",
            height: "24",
            width: "24",
        });

        if (tablaUsuariosConectadosCreada === false){
            tablaUsuariosConectados = $("<tbody/>", {
                class: "tablaUsuariosConectados",
            });
        }

        let tr = $("<tr/>",{
            class: "newUserRow",
        });

        icon.append(imagen);
        iconEstado.append(estado);
        tr.append(icon);
        tr.append(name);
        tr.append(iconEstado);
        tablaUsuariosConectados.append(tr);
        if(tablaUsuariosConectadosCreada === false) {
            tablaUsuarios.append(tablaUsuariosConectados);
            tablaUsuariosConectadosCreada = true;
        }
    }

    //Método para poner los usuarios que están conectados en la tabla del nuevo user:
    function actualizarListaUsuariosConectados(arrayUsuarios) {
        if(tablaUsuariosConectadosCreada) {
            let element = document.getElementsByClassName("tablaUsuariosConectados");
            console.log("Eliminando tabla de usuarios conectados...");
            element.remove;
            console.log("Tabla de usuarios conectados eliminada correctamente...");
            tablaUsuariosConectadosCreada = false;
        }
        let arrayLength = arrayUsuarios.length;
        for (let i = 0; i < arrayLength; i++) {
            //Antes de crear una nueva fila de un usuarios conectado tenemos que comprobar su socketID:
            if(arrayUsuarios[i].id === mySocketID){
                console.log("My socket ID: "+arrayUsuarios[i].id);
            }else{
                agregarUsuarioConectadoToTable({id: arrayUsuarios[i].id, username: arrayUsuarios[i].username, icon: arrayUsuarios[i].icon});
            }
        }
    }

    return {
        setBoard:function(newBoard){
            board = newBoard;
        },sendMove:function(moveData){
        	if(board.isCpuActive() === false && jugadorEncontrado === true){socket.emit("move",moveData, myRoom);}
        	else{
                $("#Alert").modal();
                $("#alerta").text("¡Elije contrincante!")
                board.reset();
        	}
        },crearBotonGoogle:function(){
            renderButton();
        }, enJaque:function (isJaque) {
            socket.emit("enJaque",myRoom, mySocketID, isJaque);
        }
    }
}