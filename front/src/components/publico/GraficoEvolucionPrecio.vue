<template>
    <div class="row align-items-center justify-content-center">
        <div class="col-12 col-md-10 col-lg-8">
            <h4>{{ parametros?.item?.products?.name }} - {{ parametros?.item?.nombre_comercio }}{{ parametros?.item?.empresa?.name }}</h4>
            <Chart type="line" :data="chartData" :options="chartOptions" class="w-full" />
        </div>
    </div>
    
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {  fechaDateToString, fechaStringToDate } from '../../helpers/formatter'

const props = defineProps(['parametros'])

const chartData = ref({
        labels: [],
        datasets: [
            {
                label: 'Precio a lo largo del tiempo',
                data: [],
                fill: false,
                borderColor: "#198754",
                tension: 0
            },
        ]
    });
const chartOptions = ref({
    "responsive": true
});


function insertar_ordenado( array_, elemento, campo = 'price' ){
  const ARR_LEN = array_.length

  if (ARR_LEN == 0){
    array_.push(elemento)
    return array_
  }

  for (let i=0; i < ARR_LEN; i++){
    if (array_[i][campo] > elemento[campo]){
      array_.splice(i, 0, elemento)
      return array_
    }
  }

  array_.push(elemento)
  return array_
}


function formateaFecha( fecha, time ){
    let hora = new Date(time)
    fecha = new Date(fecha)
    console.log(fecha, hora)
    fecha.setHours(hora.getHours(), hora.getMinutes(), hora.getSeconds())
    
    return fechaDateToString(new Date(fecha),"/", "dd-mm-YYYY H:M" )
}

onMounted(() => {
    let labels = []

    let precios = []
    let resultados = props.parametros.resultados['items']

    for (let i = 0; i < resultados.length; i++){
        let fecha = new Date(resultados[i].time)
        resultados[i]['time'] = fecha.getTime()
        precios = insertar_ordenado(precios, resultados[i], 'time')
    }

    let data_set = []
    let fecha_existe = {}
    let aux_fechas = []
    for (let i = 0; i < precios.length; i++){
        if ( fecha_existe[precios[i]['date_time']] == undefined){
            fecha_existe[precios[i]['date_time']] = true
            labels.push( formateaFecha( precios[i].date_time, precios[i].time ) )
            aux_fechas.push( precios[i]['date_time'] )
            data_set.push( precios[i].price )
        }
    }

    let labels_aux = []
    let data_aux = []
    const CANT_E = data_set.length
    if (CANT_E > 1){
        for (let i = 1; i < CANT_E; i++){
            let dato1_f = new Date(aux_fechas[i-1])
            let dato2_f = new Date(aux_fechas[i])

            labels_aux.push( labels[i-1])
            data_aux.push( data_set[i-1] )
            
            if (dato1_f.getTime() < dato2_f.getTime() ){
                console.log(dato1_f.getTime(), dato2_f.getTime())
                let f_ini = new Date(dato1_f)
                f_ini.setDate(f_ini.getDate() + 1)
                while (f_ini.getTime() < dato2_f.getTime()){
                    labels_aux.push( fechaDateToString( f_ini, "/", 'dd-mm-YYYY' ) )
                    data_aux.push( data_set[i-1] )
                    f_ini.setDate(f_ini.getDate() + 1)
                }           
            }
        }
        labels_aux.push( labels[CANT_E-1])
        data_aux.push( data_set[CANT_E-1] )
        labels = labels_aux
        data_set = data_aux
    }

    chartData.value.labels = labels
    chartData.value.datasets[0].data = data_set
})
</script>