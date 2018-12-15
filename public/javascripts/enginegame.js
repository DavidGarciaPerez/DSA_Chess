function Enginegame(){
    let board;
    let engine = new Worker('./lib/stockfish/stockfish.js');
    // show the engine status to the front end
    let isEngineReady = false; // default
    //var engineFeedback = null; // the format could be Depth: <something> Nps: <something>

    let time = { depth:1 };
    let playerColor = "white"; //default


    //interface to send commands to the UCI
    function uciCmd(cmd){
        engine.postMessage(cmd);
    }

    // tell the engine to use UCI
    uciCmd('uci');

    //get all the moves were made
    function getMoves(){
        let moves = "";
        let history = board.getMoveHistory();
        for(let i =0;i<history.length;i++){
            let move = history[i];
            moves+= " " + move.from + move.to + (move.promotion?move.promotion:"");
        }
        return moves;
    }
    //prepare the move, this function asks the engine to start
    //look for best move, the engine will invoke onmessage when
    //it has completed search within specific depth

    function prepareMove(){
        //update the latest board positions before search for moves
        board.setFenPosition();
        let turn = board.getTurn()==='w'?'white':'black';

        if(!board.isGameOver() && turn!==playerColor){
            //tell the engines all the moves that were made
            uciCmd('position startpos moves ' + getMoves());
            //start searching, if depth exists, use depth paramter, else let the engine use default
            uciCmd('go '+(time.depth?'depth ' +time.depth:''));
        }
    }

    engine.onmessage = function(event){
        let line = event.data?event.data:event;
        if(line === 'readyok'){
            isEngineReady=true;
        } else {
            let match = String(line).match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?.\bbestmoveSan ...([+]|[#])?/);
            if(match){
                let move = {from: match[1], to: match[2]};
                board.makeMove(move);
                prepareMove();
            }
        }
    };

    return {
        setBoard:function(newBoard){
            board = newBoard;
        },reset:function(){
            // reset the board position
            board.reset();
        },setPlayerColor:function(color){ // set the player color, black or white
            playerColor = color;
            board.setOrientation(playerColor);
        },setDepth:function(depth){
            time = {depth:depth}
        },start:function(){
            uciCmd('ucinewgame');
            uciCmd('isready');
            board.startBoard();
            prepareMove();
        },prepareAiMove:function(){
            window.setTimeout(function () {
                prepareMove();
            },100);
        }
    }


}
