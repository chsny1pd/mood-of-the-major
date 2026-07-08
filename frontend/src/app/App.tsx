import { AppProviders } from "./providers";
import RouterApp from "./RouterApp";

export default function App() {
  return (
    <AppProviders>
      <RouterApp />
    </AppProviders>
  );
}
