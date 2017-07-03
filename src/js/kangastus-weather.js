/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, _ */

(function(){
  'use strict';
  
  $.widget("custom.kangastusWeather", {
    
    options: {
      apiKey: '',
      wfsUrl: '',
      place: ''
    },
    
    _create : function() {
      
    },
    
    getTemperatures: function (apiKey, place) {
      return new Promise((resolve, reject) => {
        const url = `${this.options.wfsUrl}/fmi-apikey/${this.options.apiKey}/wfs?request=getFeature&storedquery_id=fmi::forecast::harmonie::hybrid::point::simple&place=${this.options.place}`;
       
        $.ajax({
          type : "GET",
          dataType: "text",
          processData: false,
          url: url,  
          success: (data) => {
            const x2js = new X2JS();
            const result = x2js.xml_str2json(data);
            
            const temperatureMembers = _.filter(result['FeatureCollection']['member'], (member) => {
              const element = member['BsWfsElement'];
              const param = element['ParameterName'].toString();
              return "Temperature" === param;
            });

            const values = _.filter(_.map(temperatureMembers, (temperatureMember) => {
              const element = temperatureMember['BsWfsElement'];
              const value = element['ParameterValue'].toString();
              return {
                'time': new Date(Date.parse(element['Time'].toString())),
                'value': parseFloat(value)
              };
            }), (object) => { return !!object.value; });

            resolve(values);
          },
          error: (jqXHR, textStatus, errorThrown) => {
            reject(errorThrown || textStatus);
          }
        });
        
      });
    },
    
    getTemperature: function () {
      return this.getTemperatures()
       .then((temperatures) => {
         if (temperatures && temperatures.length) {
           return temperatures[0];
         }

         return null;
       });
    }
  });

})();