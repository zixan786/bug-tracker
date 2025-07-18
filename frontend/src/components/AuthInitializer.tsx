import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { getProfile } from "../store/slices/authSlice";

interface AuthInitializerProps {
  children: React.ReactNode;
}

function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // If we have a token but no user data, fetch the profile
    if (token && !user && isAuthenticated) {
      dispatch(getProfile());
    }
  }, [dispatch, token, user, isAuthenticated]);

  return <>{children}</>;
}

export default AuthInitializer;
