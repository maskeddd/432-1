import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import "./index.css"
import { WebStorageStateStore } from "oidc-client-ts"
import { AuthProvider } from "react-oidc-context"
import { Route, Routes } from "react-router"
import App from "./routes/app.tsx"
import AuthRoute from "./routes/auth.tsx"
import Layout from "./routes/layout.tsx"

const cognitoAuthConfig = {
	authority: import.meta.env.VITE_COGNITO_AUTHORITY,
	client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
	response_type: "code",
	scope: "phone openid email profile",
	userStore: new WebStorageStateStore({ store: window.localStorage }),
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider {...cognitoAuthConfig}>
			<BrowserRouter>
				<Routes>
					<Route element={<Layout />}>
						<Route element={<AuthRoute />}>
							<Route path="/" index element={<App />} />
						</Route>
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	</StrictMode>
)
