

var model = {
    mycar: undefined,
    mycarxpos: 10,
    mycarypos: 10,
    loadedCars: [],
    carsCurrentXPositions:[],
    carsCurrentYPositions:[],
    movex: function(){
        model.mycarxpos+=10;
        model.paintCars();
        if(module.stompClient != null)
        module.stompClient.send("/topic/car"+model.mycar.number, {}, JSON.stringify({car:model.mycar.number,xpos:model.mycarxpos}));
    },
    paintCars: function(){
        canvas=document.getElementById("cnv");
        ctx=canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        //paint my car
        model.paint(model.mycar,model.mycarxpos,model.mycarypos,ctx);
        
        //paint competitors cars
        model.loadedCars.forEach(
                function(car){
                    model.paint(car,model.carsCurrentXPositions[car.number],model.carsCurrentYPositions[car.number],ctx);
                }
        );
    },
    paint: function(car,xposition,yposition,ctx){
    
        var img = new Image;
        img.src = "img/car.png";
        img.onload = function(){        
            ctx.drawImage(img,xposition,yposition); 
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.fillText(""+car.number, xposition+(img.naturalWidth/2), yposition+(img.naturalHeight/2));        
        };    
    }
}


var module = {
    stompClient: null,
    initAndRegisterInServer: function(){
        model.mycar={number:document.getElementById("playerid").value};
        model.mycarxpos=10;
        model.mycarypos=10;

        axios.put('races/25/participants', {data:JSON.stringify(model.mycar)})
          .then(function (response) {
                alert("Competitor registered successfully!");
                model.paintCars();
          })
          .catch(function (error) {
                alert("error:"+error);
          });
    },
    loadCompetitorsFromServer: function () {
        if (model.mycar == undefined) {
            alert('Register your car first!');
        } else {
            axios.get("races/25/participants")
            .then(function (response) {
                        model.loadedCars = response.data;
                        var carCount = 1;
                        alert("Competitors loaded!");
                        model.loadedCars.forEach(
                                function (car) {
                                    if (car.number != model.mycar.number) {
                                        model.carsCurrentXPositions[car.number] = 10;
                                        model.carsCurrentYPositions[car.number] = 40 * carCount;
                                        carCount++;
                                    }
                                }
                        );
                        model.paintCars();
                        module.connectAndSubscribeToCompetitors();
                    }
            );
        }
    
    },
    connectAndSubscribeToCompetitors: function (){
        var socket = new SockJS('/stompendpoint');
        module.stompClient = Stomp.over(socket);
        module.stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
    
            model.loadedCars.forEach(
                    
                    function (car) {
                        //don't load my own car
                        if (car.number!=model.mycar.number){
                            module.stompClient.subscribe('/topic/car'+car.number, function (data) {
                                msgdata=JSON.parse(data.body);
                                model.carsCurrentXPositions[msgdata.car]=msgdata.xpos;
                                model.paintCars();
                            });
                        }
                    }
            );                
        });
    },
    disconnect: function(){
        if (module.stompClient != null) {
            module.stompClient.disconnect();
        }
        setConnected(false);
        console.log("Disconnected");
    }    
}


document.addEventListener('DOMContentLoaded', function(){
    console.info('loading script!...');
    document.getElementsByClassName(".controls").disabled = false;
    document.getElementById("racenum").disabled = true;
}, false);

