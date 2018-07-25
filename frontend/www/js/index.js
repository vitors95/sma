var global_position;
var global_signal;
var global_carrier;
var global_ID;
var global_counter = 0;
var global_temporizador = 0;
var global_timer;
var servidor = '18.237.86.225:5013';

 function rememberInfo() {
   document.getElementById("email").value =  window.localStorage.getItem('remember_email');
   document.getElementById("senha").value = window.localStorage.getItem('remember_password');
 }

 function login()  {

   $('#loading_image').show();

   var email = document.getElementById("email").value;
   var password = document.getElementById("senha").value;

   if(document.getElementById("remember").checked == true) {
     window.localStorage.setItem('remember_email', email);
     window.localStorage.setItem('remember_password', password);
   }
   else {
     window.localStorage.removeItem('remember_email');
     window.localStorage.removeItem('remember_password');
   }

   var mypbkdf2 = new PBKDF2(password, 'UMASPALAVRAMUITODOIDAAI#%#@165321', 2000, 32);
   var status_callback = function(percent_done) {

  };
   var result_callback = function(key) {

    var login_obj = new Object();
    login_obj['email'] = email;
    login_obj['senha'] = key;

    var login_JSON = JSON.stringify(login_obj);

    $.ajax({
      type       : "POST",
      url        : "http://" + servidor + "/login",
      crossDomain: true,
      data       : login_JSON,
      async      : false,
      dataType   : 'json',
      contentType: 'application/json; charset=utf-8',
      complete: function(){
        $('#loading_image').hide();
      },
      success    : function(response) {

        if(response['id'] != (-1)) {
          window.location.href="app.html";
        }

        else {
          document.getElementById("senha").value = "";
          alert('E-mail ou senha incorretos.');
        }

      },
      error      : function() {
        alert('Falha na comunicação com o servidor! \nVerifique sua conexão.');
      }
    });

  };
  mypbkdf2.deriveKey(status_callback, result_callback);
 }


 function cadastrar() {

   var email = document.getElementById("email").value;
   var password = document.getElementById("senha").value;
   var confirm_password = document.getElementById("conf_senha").value;
   var telefone = document.getElementById("telefone").value;
   var nome = document.getElementById("nome").value;

   if (password != confirm_password) {
     alert("As senhas devem ser iguais");
   }
   else {
     if (email == "" || password == "" || telefone == "" || nome == "") {
       alert("Preencha todos os campos.");
     }
     else {

       $('#loading_image').show();

        var mypbkdf2 = new PBKDF2(password, 'UMASPALAVRAMUITODOIDAAI#%#@165321', 2000, 32);
        var status_callback = function(percent_done) {
        };
        var result_callback = function(key) {

          var date = new Date();
          var data_final = date.getFullYear() + '-'
          + ('0' + (date.getMonth() + 1)).slice(-2) + '-'
          + ('0' + date.getDate()).slice(-2) + ' '
          + ('0' + date.getHours()).slice(-2) + ':'
          + ('0' + date.getMinutes()).slice(-2) + ':'
          + ('0' + date.getSeconds()).slice(-2);

          var cadastro_obj = new Object();
          cadastro_obj['email'] = email;
          cadastro_obj['senha'] = key;
          cadastro_obj['telefone'] = telefone;
          cadastro_obj['nome'] = nome;
          cadastro_obj['data'] = data_final;

          var cadastro_JSON = JSON.stringify(cadastro_obj);

          $.ajax({
            type       : "POST",
            url        : "http://" + servidor + "/cadastro",
            crossDomain: true,
            data       : cadastro_JSON,
            async      : false,
            dataType   : 'json',
            contentType: 'application/json; charset=utf-8',
            complete: function(){
              $('#loading_image').hide();
            },
            success    : function(response) {

              if(response['ok'] != (-1)) {
                alert('Cadastro realizado com sucesso!');
                window.location.href ="index.html";
              }
              else {
                alert('Endereço de e-mail ou telefone já cadastrados.');
              }

            },
            error      : function() {
              alert('Falha na comunicação com o servidor! \n Verifique sua conexão.');
            }
          });

        };
        mypbkdf2.deriveKey(status_callback, result_callback);
      }
    }
  }


var app = {
   // Application Constructor
   initialize: function() {
       document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

   },

   // deviceready Event Handler
   //
   // Bind any cordova events here. Common events are:
   // 'pause', 'resume', etc.
   onDeviceReady: function() {
       this.receivedEvent('deviceready');
       document.getElementById("getResultado").addEventListener("click", getResultado);
       //document.getElementById("Background").addEventListener("click", toBackground);
       document.getElementById("changeInterval").addEventListener("click", changeInterval);

       var message = "Selecione o intervalo de tempo entre as coletas.";
       var title = "Coletas";
       var buttonLabels = "2 minutos,30 segundos,5 minutos";
       navigator.notification.confirm(message, confirmCallback, title, buttonLabels);

       function confirmCallback(buttonIndex) {

         switch (buttonIndex) {
           case 0:
             navigator.notification.confirm(message, confirmCallback, title, buttonLabels);
           break;
           case 1:
             global_temporizador = 120000;
           break;
           case 2:
             global_temporizador = 30000;
           break;
           case 3:
             global_temporizador = 300000;
           break;
           default:
           break;
         }

         if(global_temporizador != 0) {
           document.getElementById('ColetasTemp').innerHTML = (global_temporizador/1000);
           initApp();
         }
       }

       function initApp() {

         cordova.plugins.backgroundMode.enable();
         cordova.plugins.backgroundMode.on('activate', global_timer = setInterval(getColeta, global_temporizador));
         cordova.plugins.backgroundMode.on('activate', function() {
           cordova.plugins.backgroundMode.disableWebViewOptimizations();
         });
         cordova.plugins.backgroundMode.overrideBackButton();
         cordova.plugins.backgroundMode.setDefaults({
           title: 'Smart Mobile Analizer',
           text: 'Coletando informações.',
           icon: 'logo', // this will look for icon.png in platforms/android/res/drawable|mipmap
           color: 'FFFFFF'
           //resume: Boolean,
           //hidden: Boolean,
           //bigText: Boolean
         });
       }

       function getColeta() {

         getStrength();
         getCarrier();
         getPosition();

         var coleta_posicao = global_posicao;
         var coleta_sinal = global_sinal;
         var coleta_operadora = global_carrier;

         if(coleta_sinal.sinal < (-1)) {
         var coleta_full = Object.assign({}, coleta_posicao, coleta_sinal, coleta_operadora);

         var coleta = JSON.stringify(coleta_full);

         $.ajax({
           type       : "POST",
           url        : "http://" + servidor + "/coleta",
           crossDomain: true,
           data       : coleta,
           dataType   : 'json',
           contentType: 'application/json; charset=utf-8',
           success    : function(response) {
               //alert('Enviou!');
               global_counter = global_counter + 1;
               document.getElementById('ColetasCount').innerHTML = global_counter;

             },
             error      : function() {
               //alert('Nao enviou para o servidor!');
             }
           });

         }

       }

       // function toBackground() {
       //   cordova.plugins.backgroundMode.moveToBackground();
       // }

       function changeInterval() {

         var message = "Selecione o intervalo de tempo entre as coletas.";
         var title = "Coletas";
         var buttonLabels = "2 minutos,30 segundos,5 minutos";
         navigator.notification.confirm(message, confirmCallback, title, buttonLabels);

         function confirmCallback(buttonIndex) {

           switch (buttonIndex) {
             case 0:
               navigator.notification.confirm(message, confirmCallback, title, buttonLabels);
             break;
             case 1:
               global_temporizador = 120000;
             break;
             case 2:
               global_temporizador = 30000;
             break;
             case 3:
               global_temporizador = 300000;
             break;
             default:
             break;
           }

           clearInterval(global_timer);
           document.getElementById('ColetasTemp').innerHTML = (global_temporizador/1000);
           initApp();

         }
       }


       function getPosition() {

          var options = {
             enableHighAccuracy: true,
             timeout: global_temporizador,
             maximumAge: 1
          }

          var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

          function onSuccess(position) {

             var timestamp = position.timestamp;
             var date = new Date(timestamp);
             var data_final = date.getFullYear() + '-'
             + ('0' + (date.getMonth() + 1)).slice(-2) + '-'
             + ('0' + date.getDate()).slice(-2) + ' '
             + ('0' + date.getHours()).slice(-2) + ':'
             + ('0' + date.getMinutes()).slice(-2) + ':'
             + ('0' + date.getSeconds()).slice(-2);

             var posicao = new Object();
             posicao['latitude'] = String(position.coords.latitude);
             posicao['longitude'] = String(position.coords.longitude);
             posicao['data'] = data_final;
             posicao['precisao'] = String(position.coords.accuracy);

             global_posicao = posicao;

          };

          function onError(error) {
             //alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
          }
       }

         function getStrength() {
           window.SignalStrength.dbm(
             function(measuredDbm){
               var sinal = new Object();
               sinal['sinal'] = String(measuredDbm);
               global_sinal = sinal;
             }
           )
         }

         function getResultado() {
           window.location.href="result.html";
         }


         function getCarrier() {
           window.plugins.sim.getSimInfo(successCallback, errorCallback);

           function successCallback(op) {
             var carrier = new Object();
             carrier['operadora'] = op.carrierName;

             switch (op.networkType) {
               case 0:
                 carrier['tecnologia'] = "Unknown";
                 break;
               case 1:
                 carrier['tecnologia'] = "2G";
                 break;
               case 2:
                 carrier['tecnologia'] = "2G";
                 break;
               case 3:
                 carrier['tecnologia'] = "3G";
                 break;
               case 4:
                 carrier['tecnologia'] = "3G";
                 break;
               case 5:
                 carrier['tecnologia'] = "3G";
                 break;
               case 6:
                 carrier['tecnologia'] = "3G";
                 break;
               case 7:
                 carrier['tecnologia'] = "3G";
                 break;
               case 8:
                 carrier['tecnologia'] = "3G";
                 break;
               case 9:
                 carrier['tecnologia'] = "3G";
                 break;
               case 10:
                 carrier['tecnologia'] = "3G";
                 break;
               case 11:
                 carrier['tecnologia'] = "2G";
                 break;
               case 12:
                 carrier['tecnologia'] = "3G";
                 break;
               case 13:
                 carrier['tecnologia'] = "4G";
                 break;
               case 14:
                 carrier['tecnologia'] = "3G";
                 break;
               case 15:
                 carrier['tecnologia'] = "4G";
                 break;
               case 16:
                 carrier['tecnologia'] = "2G";
                 break;
               case 17:
                 carrier['tecnologia'] = "3G"
                 break;
               case 18:
                 carrier['tecnologia'] = "Unknown";
                 break;
               default:
                 carrier['tecnologia'] = "Unknown";
                 break;
             }
             global_carrier = carrier;

           }

           function errorCallback(error) {
             //alert('não foi possível pegar a operadora');
             //alert(error);
           }

           // Android only: check permission
           function hasReadPermission() {
             window.plugins.sim.hasReadPermission(successCallback, errorCallback);
           }

           // Android only: request permission
           function requestReadPermission() {
             window.plugins.sim.requestReadPermission(successCallback, errorCallback);
           }
         }

   },

   // Update DOM on a Received Event
   receivedEvent: function(id) {
       var parentElement = document.getElementById(id);
       var listeningElement = parentElement.querySelector('.listening');
       var receivedElement = parentElement.querySelector('.received');

       listeningElement.setAttribute('style', 'display:none;');
       receivedElement.setAttribute('style', 'display:block;');

       console.log('Received Event: ' + id);
   }
};

app.initialize();
