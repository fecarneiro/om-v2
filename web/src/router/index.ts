import { createRouter, createWebHistory } from "vue-router";
import { useSessaoStore } from "@/stores/sessao";
import CarteiraView from "@/views/CarteiraView.vue";
import LoginView from "@/views/LoginView.vue";
import PedidoView from "@/views/PedidoView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/clientes" },
    { path: "/login", component: LoginView },
    { path: "/clientes", component: CarteiraView },
    { path: "/clientes/:clienteId/pedido", component: PedidoView },
  ],
});

router.beforeEach((to) => {
  const sessao = useSessaoStore();
  if (!sessao.vendedor && to.path !== "/login") return "/login";
  if (sessao.vendedor && to.path === "/login") return "/clientes";
});

export default router;
