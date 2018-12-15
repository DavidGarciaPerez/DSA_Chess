let newGame;
let client;
let engine;
let board;
// inicializamos main.js al acceder a la web
let init = function() {
    //Inicializamos los objetos necesarios:
        client = Socketclient();
        board = Board();
        engine = Enginegame();

        //Añadimos parámetros necesarios:
        board.setClient(client);
        board.setChessEngine(engine);
        client.setBoard(board);
        client.crearBotonGoogle();

        newGame = function(){
                engine.setBoard(board);
                engine.reset();
                engine.setDepth();
                engine.setPlayerColor("white");
                engine.start();
        };

        newGame();

}; // end init()

$(document).ready(init);


