import { useAuth } from "react-oidc-context"
import { NavLink, Outlet } from "react-router"

export default function Layout() {
	const auth = useAuth()

	const signOutRedirect = () => {
		const clientId = "188n87cm03j4saf9n20gjijpaj"
		const logoutUri = window.location.origin
		const cognitoDomain =
			"https://ap-southeast-2juc9sbggm.auth.ap-southeast-2.amazoncognito.com"

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
							<button
								type="button"
								className="btn btn-ghost"
								onClick={signOutRedirect}
							>
								{auth.user?.profile.preferred_username || "log out"}
							</button>
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
