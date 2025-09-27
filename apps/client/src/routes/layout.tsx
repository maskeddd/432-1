import { useAuth } from "react-oidc-context"
import { NavLink, Outlet } from "react-router"

export default function Layout() {
	const auth = useAuth()

	const signOutRedirect = () => {
		const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID
		const logoutUri = window.location.origin
		const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN

		auth.removeUser()
		window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
			logoutUri
		)}`
	}

	return (
		<div className="lowercase">
			<header>
				<div className="navbar bg-base-300 shadow-sm">
					<div className="flex-1">
						<NavLink className="btn btn-ghost text-xl" to="/">
							Clipper
						</NavLink>
					</div>
					<div className="flex-none">
						{auth.isAuthenticated ? (
							<div className="dropdown dropdown-end">
								<button
									tabIndex={0}
									type="button"
									className="btn btn-ghost rounded-field"
								>
									{auth.user?.profile.preferred_username}
								</button>
								<ul
									tabIndex={0}
									className="menu dropdown-content bg-base-200 rounded-box z-1 mt-4 w-52 p-2 shadow-sm"
								>
									<li className="menu-disabled">
										<p>{auth.user?.profile.email}</p>
									</li>
									<li>
										<button type="button" onClick={signOutRedirect}>
											logout
										</button>
									</li>
								</ul>
							</div>
						) : (
							<button
								type="button"
								className="btn btn-neutral"
								onClick={() => auth.signinRedirect()}
							>
								log in
							</button>
						)}
					</div>
				</div>
			</header>
			<main>
				<div className="flex flex-col mx-auto p-4 pt-0 md:max-w-xl lg:max-w-3xl my-4 items-center">
					<Outlet />
				</div>
			</main>
		</div>
	)
}
