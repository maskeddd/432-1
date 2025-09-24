import { useAuth } from "react-oidc-context"
import { Outlet } from "react-router"

export default function AuthRoute() {
	const auth = useAuth()

	if (auth.isLoading) {
		return <div>Loading...</div>
	}

	if (!auth.isAuthenticated) {
		return <div>please log in to continue</div>
	}

	return <Outlet />
}
