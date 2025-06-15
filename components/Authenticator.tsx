'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, FunctionComponent, JSX } from 'react';

import { useGetUserQuery } from '@/features/userSlice';
import { User } from '@/interfaces/models';

import Spinner from './Spinner';

export type WithUserProp = { user: User }

export default function withAuth<T extends JSX.IntrinsicAttributes>(Component: FunctionComponent<T & WithUserProp>): FunctionComponent<T> {
    return function WithAuth(props: T): React.ReactElement | null {
        const user = useGetUserQuery();
        const pathname = usePathname();
        const router = useRouter();
        const searchParams = useSearchParams();

        useEffect(() => {
            if (!user.isFetching && !user.data) {
                const redirectTo = pathname ?? '/';
                if (pathname !== '/profile' ) {
                    if(redirectTo === '') router.replace('/profile');
                    else router.replace(`/profile?redirectTo=${encodeURIComponent(redirectTo)}`);
                }
            }
        }, [pathname, router, searchParams, user.data, user.isFetching]);

        if (user.isFetching) return <Spinner />;
        if (!user.data) return null;

        return <Component {...props} user={user.data} />;
    };
}
