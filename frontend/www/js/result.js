 var global_usuario_ID;
 var servidor = '18.237.86.22:5013';

 var TILE_SIZE = 256;
 var desiredRadiusPerPointInMeters = 7.5;

 function getNewRadius() {


           var numTiles = 1 << map.getZoom();
           var center = map.getCenter();
           var moved = google.maps.geometry.spherical.computeOffset(center, 10000, 90); /*1000 meters to the right*/
           var projection = new MercatorProjection();
           var initCoord = projection.fromLatLngToPoint(center);
           var endCoord = projection.fromLatLngToPoint(moved);
           var initPoint = new google.maps.Point(
             initCoord.x * numTiles,
             initCoord.y * numTiles);
            var endPoint = new google.maps.Point(
             endCoord.x * numTiles,
             endCoord.y * numTiles);
         var pixelsPerMeter = (Math.abs(initPoint.x-endPoint.x))/10000.0;
         var totalPixelSize = Math.floor(desiredRadiusPerPointInMeters*pixelsPerMeter);
         console.log(totalPixelSize);
         return totalPixelSize;

       }

 //Mercator --BEGIN--
      function bound(value, opt_min, opt_max) {
          if (opt_min !== null) value = Math.max(value, opt_min);
          if (opt_max !== null) value = Math.min(value, opt_max);
          return value;
      }

      function degreesToRadians(deg) {
          return deg * (Math.PI / 180);
      }

      function radiansToDegrees(rad) {
          return rad / (Math.PI / 180);
      }

      function MercatorProjection() {
          this.pixelOrigin_ = new google.maps.Point(TILE_SIZE / 2,
          TILE_SIZE / 2);
          this.pixelsPerLonDegree_ = TILE_SIZE / 360;
          this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
      }

      MercatorProjection.prototype.fromLatLngToPoint = function (latLng,
      opt_point) {
          var me = this;
          var point = opt_point || new google.maps.Point(0, 0);
          var origin = me.pixelOrigin_;

          point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

          // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
          // 89.189.  This is about a third of a tile past the edge of the world
          // tile.
          var siny = bound(Math.sin(degreesToRadians(latLng.lat())), - 0.9999,
          0.9999);
          point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
          return point;
      };

      MercatorProjection.prototype.fromPointToLatLng = function (point) {
          var me = this;
          var origin = me.pixelOrigin_;
          var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
          var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
          var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
          return new google.maps.LatLng(lat, lng);
      };


 function findMin(arr) {
   var len = arr.length, min = Infinity;
   while (len--) {
     if (arr[len] < min) {
       min = arr[len];
     }
   }
   return min;
 };

 function findMax(arr) {
   var len = arr.length, max = -Infinity;
   while (len--) {
     if (arr[len] > max) {
       max = arr[len];
     }
   }
   return max;
 };

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
           window.localStorage.setItem('key', response['id']);
           window.location.href="result.html";

         }
         else {
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

  function initMap() {
     map = new google.maps.Map(document.getElementById('map'), {
       zoom: 17,
       center: {lat: -27.608447, lng: -48.633235}
     });
   }

  function toggleHeatmap() {
    heatmap.setMap(heatmap.getMap() ? null : map);
  }

  // function changeGradient() {
  //   var gradient = [
  //     'rgba(0, 255, 255, 0)',
  //     'rgba(0, 255, 255, 1)',
  //     'rgba(0, 191, 255, 1)',
  //     'rgba(0, 127, 255, 1)',
  //     'rgba(0, 63, 255, 1)',
  //     'rgba(0, 0, 255, 1)',
  //     'rgba(0, 0, 223, 1)',
  //     'rgba(0, 0, 191, 1)',
  //     'rgba(0, 0, 159, 1)',
  //     'rgba(0, 0, 127, 1)',
  //     'rgba(63, 0, 91, 1)',
  //     'rgba(127, 0, 63, 1)',
  //     'rgba(191, 0, 31, 1)',
  //     'rgba(255, 0, 0, 1)'
  //   ]
  //   heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
  // }
  //
  // function changeRadius() {
  //   heatmap.set('radius', heatmap.get('radius') ? null : 30);
  // }
  //
  // function changeOpacity() {
  //   heatmap.set('opacity', heatmap.get('opacity') ? null : 0.4);
  // }

  function totalColetas() {

    $('#loading_image').show();

    $.ajax({
      type       : "GET",
      url        : "http://" + servidor + "/coletas",
      crossDomain: true,
      async      : false,
      dataType   : 'json',
      contentType: 'application/json; charset=utf-8',
      complete: function(){
        $('#loading_image').hide();
      },
      success    : function(response) {
        document.getElementById('numColetas').innerHTML = response['total'];
        $('#lbColetas').show();
      },
      error      : function() {
        alert('Falha na comunicação com o servidor! \nVerifique sua conexão.');
      }
    });
  }


  function result() {

    var aux_op = document.getElementById("select_operadora");
    op = aux_op.options[aux_op.selectedIndex].value;

    var aux_tec = document.getElementById("select_tecnologia");
    tec = aux_tec.options[aux_tec.selectedIndex].value;

    $('#loading_image').show();

    $.ajax({
      type       : "GET",
      url        : "http://" + servidor + "/coletas/"+op+'/'+tec,
      crossDomain: true,
      async      : false,
      dataType   : 'json',
      contentType: 'application/json; charset=utf-8',
      complete: function(){
        $('#loading_image').hide();
      },
      success    : function(response) {
        document.getElementById('numEnquadradas').innerHTML = response['total'];
        $('#lbEnquadradas').show();
      },
      error      : function() {
        alert('Falha na comunicação com o servidor! \nVerifique sua conexão.');
      }
    });

    initMap();

    $('#loading_image').show();

    $.ajax({
      type       : "GET",
      url        : "http://" + servidor + "/result/"+op+'/'+tec,
      crossDomain: true,
      async      : false,
      dataType   : 'json',
      contentType: 'application/json; charset=utf-8',
      complete: function(){
        $('#loading_image').hide();
      },
      success    : function(response) {

        var aux = new Array(response.length);

        for (var i=0; i<response.length; i++){
          aux[i] = response[i]['sinal'];
        }

        max = findMax(aux);
        min = findMin(aux);

        /* ALGORITIMO PARA DEFINIÇÃO DO PESO */

        dif_max = max - min;
        exp_max_dif = dif_max/10;
        x_max_dif = Math.pow(10, exp_max_dif);
        base = Math.pow(x_max_dif, 0.1);

        var dif = new Array(response.length);
        var exp_dif = new Array(response.length);
        var x = new Array(response.length);
        var r = new Array(response.length);

        for (var i=0; i<response.length; i++){
          dif[i] = aux[i] - min;
          exp_dif[i] = dif[i]/10;
          x[i] = Math.pow(10, exp_dif[i]);
          r[i] = Math.log(x[i])/Math.log(base);
        }

        /* FINAL DO ALGORITIMO */

        var mapPoints = new Array(response.length);

          for (var i=0; i<response.length; i++){
            mapPoints[i] = {location: new google.maps.LatLng(response[i]['latitude'], response[i]['longitude']), weight: r[i]};
          }

          var pointArray = new google.maps.MVCArray(mapPoints);

          heatmap = new google.maps.visualization.HeatmapLayer({
            data: pointArray,
            //map: map,
            radius: getNewRadius()
          });

          heatmap.setMap(map);

          google.maps.event.addListener(map, 'zoom_changed', function () {
            heatmap.setOptions({radius:getNewRadius()});
          });

        },
        error      : function() {
          alert('Falha na comunicação com o servidor! \nVerifique sua conexão.');
        }
      });

  }
