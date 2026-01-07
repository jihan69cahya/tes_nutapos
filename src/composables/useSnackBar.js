import { reactive } from "vue";

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
  timeout: 3000,
});

export const useSnackbar = () => {
  const showSnackbar = (text, color = "success", timeout = 3000) => {
    snackbar.text = text;
    snackbar.color = color;
    snackbar.timeout = timeout;
    snackbar.show = true;
  };

  return {
    snackbar,
    showSnackbar,
  };
};
