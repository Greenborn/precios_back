import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

import "./assets/styles/layout.scss";

import { createApp, reactive } from "vue";
import { getRouterConRutas } from './utils/auth'
import { routerBeforeEach } from './utils/routes'
import { router } from "./router";

import Menubar from 'primevue/menubar';
import Chart from 'primevue/chart';
import Button from "primevue/button";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ContextMenu from 'primevue/contextmenu';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import RadioButton from 'primevue/radiobutton';
import Checkbox from 'primevue/checkbox';
import Editor from 'primevue/editor';
import DatePicker from 'primevue/datepicker';

import InputText from 'primevue/inputtext';
import InputPassword from 'primevue/inputpassword';

import { createPinia } from "pinia";
import { AppStore } from "./stores/app";
import App from './App.vue'

const app = createApp(App);
app.use(createPinia());

app.use(PrimeVue, { ripple: true, inputVariant: "outlined", theme: { preset: Aura } });

app.component("Button", Button);
app.component("InputText", InputText);
app.component("Checkbox", Checkbox);
app.component("InputPassword", InputPassword);
app.component("MultiSelect", MultiSelect);
app.component("Menubar", Menubar);
app.component("RadioButton", RadioButton);
app.component("DataTable", DataTable);
app.component("Dialog", Dialog);
app.component("Select", Select);
app.component("ContextMenu", ContextMenu);
app.component("Column", Column);
app.component("Editor", Editor);
app.component("DatePicker", DatePicker);
app.component("Chart", Chart);

app.use(router);

async function init() {
  const storeApp = AppStore()
  storeApp.inic_modals()
  await getRouterConRutas(router, storeApp)
  routerBeforeEach(router, storeApp)
  app.mount("#app")
}

init()
