
const gameId = "quorridor";
//plansza
const boardWidth = 9 * 2;
const boardHeight = 9 * 2;

//stworzenie tablicy płotków

//tworzenie koordy

const logicOfGame = {
    /**
     * Generuje stan początkowy gry.
     */
    generateInitialState() {
        let fencestmp = [];
        //stworzenie 
        for (let y = boardHeight - 2; y >= 1; y--) {
            if (y % 2 === 0) {
                //wiersz parzysty 
                for (let x = 1; x <= boardHeight - 3; x += 2) {
    
                    fencestmp.push([x, y]);
                }
            } else {
                //wiersz nieparzysty
                for (let x = 0; x <= boardHeight - 3; x += 2)
    
                fencestmp.push([x, y]);
            }
        }
        return {
            player1: [8, 0], // Pozycja startowa gracza x
            player2: [8, 16],
            player1fences: 10, // Ilość płotków jaką może postawić gracz x
            player2fences: 10, 
            player1WinRow:16, //cel gracza x
            player2WinRow:0,
            occupied: [], // Tablica na postawione już płotki
            fences: fencestmp //tablica możliwych płotków
        };
    },
    /**
     * Funkcja oceny, która ocenia z punktu widzenia wskazanego gracza.
     */
    evaluateState(state, player) {

        const enemy = player === "player1" ? "player2" : "player1";

        if (this.isStateTerminal(state, player)) {
            return -999;
        } else if (this.isStateTerminal(state, enemy)) {
            return 999;
        }
        let score = -this.getDistanceToEndGoal(player,state);
        score += this.getDistanceToEndGoal(enemy,state);

        //console.log(score)
        return score;
    },

    /**
     * Funkcja generująca możliwe ruchy z wskazanego stanu dla gracza.
     */
    generateMoves(state, player) {


        const placebleFences = []; //  stawialne na płotki
        
        const enemy = player === "player1" ? "player2" : "player1";
        
        //wiersze parzyste posiadają 8 płotków pionowych natomiast wiersze nie parzyste posiadają 9 płotków poziomych
        //sprawdzenie ilości płotków
        if (state[player + "fences"] > 0) {
            for (i = 0; i < state["fences"].length; i++){
                    //pominięcie sprawdzenia blokowania jeżelinie jest ich wystarczająco
                    if(state.occupied.length>2){
                        
                        //sprawdzenie czy płotek nie zablokuje kompletnie gracza
                        //symulacja postawienia
                        state.occupied.push(state["fences"][i]);
                        if(!(this.getDistanceToEndGoal(player,state)===-1))
                            if(!(this.getDistanceToEndGoal(enemy,state)===-1))
                                placebleFences.push(state["fences"][i]);
                        state.occupied.pop(state["fences"][i]);
                    }else{
                        placebleFences.push(state["fences"][i]);
                    }
                    
                }

        }

        //możliwe ruchy
        let moves =this.getPossibleMoves(state[player][0],state[player][1],player,state)
        //dodanie przeskoku nad przeciwnikiem
        if(this.doesItHasCoords(moves,[state[enemy][0],state[enemy][1]])){

            let tmp =this.getPossibleMoves(state[enemy][0],state[enemy][1],enemy,state)
            moves = moves.concat(tmp)
            moves = moves.filter(([x,y])=>!(
                (x===state[enemy][0]&&y===state[enemy][1])||
                (x===state[player][0]&&y===state[player][1])))
        }
        
        //złączenie możliwych ruchów
        if (state[player + "fences"] > 0)
            return moves.concat(placebleFences);

        return moves;
    },
    /*
     * usuwająca niemożliwych do postawienia płotków
     */
    removeCollidingFences(state, x, y) {
        //odsunięcia płotków które mogą nachodzić
        const offsets= [
            [ 0,-2],
            [ 0, 2],
            [-1,-1],
            [ 0, 0]
        ];
        //usunięcie nachodzących
        if (y % 2 === 0) {
            for(let i=0;i<offsets.length;++i){
                state["fences"] = state["fences"].filter(([fx,fy])=>!(fx===x+offsets[i][0]&&fy===y+offsets[i][1]))
                }
        } else {
            for(let i=offsets.length-1;i>=0;--i){
                state["fences"] = state["fences"].filter(([fx,fy])=>!(fx===x-offsets[i][1]&&fy===y-offsets[i][0]))
            }
        };
    },    



    // Funkcja sprawdzająca czy na drodze danego pionka znajduje się płotek
    getPossibleMoves(x,y,player,state) {
        //odsunięcia rucu
        const Offsets = [
            [ 0, 2],
            [ 0,-2],
            [ 2, 0],
            [-2, 0],
        ];
 
        //odsunięcia drugiego płotka blokującego
        const fenceOffsets = [
            [-2,-1],
            [-2, 1],
            [-1, 2],
            [+1, 2],
        ];
        //pozycja przeciwnika
        const enemy = player === "player1" ? "player2" : "player1";

        let possible=[];
        let nextX,nextY;

        for(let i=0;i<Offsets.length;i++){
            nextX = x+Offsets[i][0];
            nextY = y+Offsets[i][1];
            if (nextX >= 0 && nextX  < boardWidth && nextY  >= 0 && nextY < boardHeight) 
                    if(
                    !(this.doesItHasCoords(state["occupied"],[nextX  -(Offsets[i][0]/2),nextY - (Offsets[i][1]/2)]) ||
                    this.doesItHasCoords(state["occupied"],[nextX  + fenceOffsets[i][0],nextY + fenceOffsets[i][1]])))
                        possible.push([nextX ,nextY]);
    
        } 
        
        return possible;


    },
    /**
     * Funkcja zwraca dystans od x,y do celowanego wiersza za pomocą algorytmu BFS 
     * zwraca -1 gdy nie może znaleźć drogi do celu
     */
    getDistanceToEndGoal(player,state){
        //console.count("lol")
        //odwiedzone już miejsca
        const explored=[];
        explored.push([state[player][0],state[player][1]]);
        let unexplored
        //kolejka ruchów
        let que= [];
        que.push([state[player][0],state[player][1],0]);
        let current
        //dopóki są 
        while(que.length!==0){

            current = que.shift();
            //sprawdzenie czy jest na miejscu jak tak to znaleziono najkrótszą
            if(current[1]===state[player+"WinRow"])
                return current[2];

            unexplored = this.getPossibleMoves(current[0],current[1],player,state)
      
            //dodanie do kolejki kojenych możliwych ruchów
            for(let i=0;i<unexplored.length;i++){
                if(!this.doesItHasCoords(explored,unexplored[i])){

                    explored.push([unexplored[i][0],unexplored[i][1]]);
                    que.push([unexplored[i][0],unexplored[i][1],current[2]+1]);
                    
                }
        
            }
        }
        
        //nie znaleziono miejsca
        return -1

    },
    
    /**
     * funkcja sprawdza czy tablica ma dane koordynaty (szybsza niż array.some)
     */
    doesItHasCoords(coordsArray,coords){
        for(let i=0;i<coordsArray.length;i++)
            if(coordsArray[i][0]===coords[0]&&coordsArray[i][1]===coords[1])
                return true;
        return false;
    },
    /**
     * Funkcja generuje stan po wykonaniu wskazanego ruchu.
     */
    
    generateStateAfterMove(previousState, player, move) {
        //nowy stan gry
        const state = {
            player1: [...previousState.player1],
            player2: [...previousState.player2],
            player1fences: previousState.player1fences,
            player2fences: previousState.player2fences,
            player1WinRow: previousState.player1WinRow,
            player2WinRow: previousState.player2WinRow,
            occupied: [...previousState.occupied],
            fences: [...previousState.fences]

        };
        //czy to jest położenie płotka
        if (move[0] % 2 === 1 || move[1] % 2 === 1) {
            //dodanie zajętych płotków DO DOKOŃCZENIA
            state.occupied.push(move);
            state[player + "fences"]--
            this.removeCollidingFences(state,move[0],move[1])
        } else {
            //aktualizacja pozycji gracza
            state[player] = move;
        }
        //console.log(state)
        return state;
    },
    /**
     * Funkcja sprawdza czy stan jest terminalny, tzn. koniec gry.
     */
    isStateTerminal(state, player) {
        // Sprawdzenie czy pionek przeciwnika jest po drugiej stronie
        return state[player === "player2" ? "player1" : "player2"][1] === state[(player === "player2" ?"player1" : "player2") +"WinRow"];
    },
    /**
     * Funkcja generująca unikalny klucz dla wskazanego stanu.
     */
    generateUniqueKey: undefined,
};

const players = [
    { type: PlayerTypes.ALPHABETA, label: "AlphaBeta (łatwy)" , maxDepth: 2, printTree: false },
    { type: PlayerTypes.ALPHABETA, label: "AlphaBeta (średni)", maxDepth: 3, printTree: true },
    { type: PlayerTypes.ALPHABETA, label: "AlphaBeta (trudny)", maxDepth: 4, printTree: false },
];