
function rolagem(){
    return Math.floor(Math.random() * 6) + 1;
}

function rolar4d6(){
    var jogadas = []
    for(var contador = 0; contador <4; contador++){
        var resultado = rolagem()
        jogadas.push(resultado)
    }

    jogadas.sort (function(a,b){
        return a-b
    })
    jogadas.shift()
    return jogadas    
}

function somar_tudo(jogadas){
    var thesoma = 0
    for(var i = 0; i < jogadas.length; i++){
        thesoma +=jogadas[i]
    }
    return thesoma
}

function resultados(){
    var resultados = []
    for(var count = 0; count <6; count++){
        var jogadas = rolar4d6()
        var results = somar_tudo(jogadas)
        resultados.push(results)
    }
    return resultados
}

var somas = resultados()
console.log(somas)