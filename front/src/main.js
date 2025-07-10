import PrimeVue from "primevue/config";
import "primevue/resources/themes/nova/theme.css";
import "primevue/resources/primevue.min.css";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import * as bootstrap from 'bootstrap'

import "./assets/styles/layout.scss";

import { createApp, reactive } from "vue";
import { getRouterConRutas } from './utils/auth'
import { routerBeforeEach } from './utils/routes'
import { router } from "./router";

import Menubar from 'primevue/menubar';
import Chart from 'primevue/chart';
import InputSwitch from "primevue/inputswitch";
import Button from "primevue/button";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ContextMenu from 'primevue/contextmenu';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import RadioButton from 'primevue/radiobutton';
import Checkbox from 'primevue/checkbox';
import Editor from 'primevue/editor';
import Calendar from 'primevue/calendar';

import InputText from 'primevue/inputtext';
import Password from 'primevue/password';

import { createPinia } from "pinia";
import { AppStore } from "./stores/app";
import App from './App.vue'

const app = createApp(App);
app.use(createPinia());
const storeApp = AppStore();
app.use(storeApp)

app.use(PrimeVue, { ripple: true, inputStyle: "outlined" });

app.component("InputSwitch", InputSwitch);
app.component("Button", Button);
app.component("InputText", InputText);
app.component("Checkbox", Checkbox);
app.component("Password", Password);
app.component("MultiSelect", MultiSelect);
app.component("Menubar", Menubar);
app.component("RadioButton", RadioButton);
app.component("DataTable", DataTable);
app.component("Dialog", Dialog);
app.component("Dropdown", Dropdown);
app.component("ContextMenu", ContextMenu);
app.component("Column", Column);
app.component("Editor", Editor);
app.component("Calendar", Calendar);
app.component("Chart", Chart);

app.use(router);
app.mount("#app");
