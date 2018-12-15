//función por defecto del tablero:
function Board(){
    let board, game = Chess();
    let client;
    let chessEngine;
    let cpu = false;
    let nivelCpu = 1;

    let removeGreySquares = function () {
        $('#board .square-55d63').css('background', '');
    };

    let greySquare = function (square) {
        let squareEl = $('#board .square-' + square);

        let background = '#09a95c';
        if (squareEl.hasClass('black-3c85d') === true) {
            background = '#006904';
        }

        squareEl.css('background', background);
    };

    let onMouseoverSquare = function (square, piece) {
        // Obtenemos la lista de posibles movimientos para ésta casilla:
        let moves = game.moves({
            square: square,
            verbose: true
        });

        // return si no hay posibles movimientos para esta casilla:
        if (moves.length === 0) return;

        // Cambiamos color de la casilla:
        greySquare(square);

        // Cambiamos de color a las casillas de movimientos posibles:
        for (let i = 0; i < moves.length; i++) {
            greySquare(moves[i].to);
        }
    };

    let onMouseoutSquare = function (square, piece) {
        removeGreySquares();
    };

    let onDrop = function (source, target) {
        removeGreySquares();

        // Comprobamos si el movimiento es legal o no:
        let move = game.move({
            from: source,
            to: target,
            promotion: 'q' //Promocionamos la reina
        });

        if(game.in_check()){
            //alert("En jaque "+game.turn());
            //Mandamos alerta al otro jugador para que sepa que está en jaque:
            client.enJaque(true);
        }else{
            client.enJaque(false);
        }

        if (game.game_over()) {
            if(game.in_checkmate()){
                console.log("Turno del jugador: "+game.turn());
                if(game.turn()==="white"){
                    console.log("Han perdido las blancas porque era su turno!");
                }else{
                    console.log("Han perdido las negras porque era su turno!");
                }
            }
            //state.innerHTML = 'GAME OVER';
            //socket.emit('gameOver', roomId)
            console.log("Game over");
        }

        // Movimiento ilegal:
        if (move === null) return 'snapback';
        else {
            if (cpu) {
                window.setTimeout(chessEngine.prepareAiMove(), 100);
            } else {
                console.log("From board -> enviando: " + move.from + " - " + move.to);
                client.sendMove(move);
            }
        }

    };

    // Actualizamos la posición después de realizar el movimiento:
    let onSnapEnd = function () {
        board.position(game.fen());
    };


    // Comprobamos condiciones al coger pieza:
    let onDragStart = function (source, piece, position, orientation) {
        if ((game.in_checkmate() === true) ||
            (game.in_draw() === true) ||
            (orientation === 'white' && piece.search(/^w/) === -1) ||
            (orientation === 'black' && piece.search(/^b/) === -1)) {
            removeGreySquares();
            return false;
        }
    };


    // configuración del tablero
    let cfg = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
    };

    board = ChessBoard('board', cfg);

    return {
        setClient:function(newClient){
            client = newClient;
        },makeMove:function(moveData){
            game.move(moveData);
            //game.load(game.fen());
        },setPosition:function(){
            board.position(game.fen(), true);
        },startBoard:function(){
            board.start();
        },getMoveHistory:function(){
            return game.history({verbose:true});
        },setFenPosition:function(){
            board.position(game.fen());
        }, getTurn:function(){
            return game.turn();
        }, isGameOver:function(){
            return game.game_over();
        }, setChessEngine:function(engine){
            chessEngine = engine;
        }, reset:function(){
            game.reset();
            board.start();
        },setOrientation:function(playerColor){
            let color = playerColor.charAt(0).toLowerCase();
            if(color==='w' || color==='b')
                board.orientation(playerColor);
        },setCpu:function(competir){
            cpu = competir;
        },isCpuActive:function(){
            return cpu;
        },setCpuNivel:function(nivel){
            nivelCpu = nivel;
            chessEngine.setDepth(nivel);
        },getCpuNivel:function(){
            return nivelCpu;
        }
    }
}