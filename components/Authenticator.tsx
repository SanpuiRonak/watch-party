'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, FunctionComponent, JSX } from 'react';

import { useGetUserQuery } from '@/features/userSlice';

import Spinner from './Spinner';

export default function withAuth<T extends JSX.IntrinsicAttributes>(Component: FunctionComponent<T>): FunctionComponent<T> {
    return function WithAuth(props: T): React.ReactElement {
        const user = useGetUserQuery();
        const pathname = usePathname();
        const router = useRouter();
        const searchParams = useSearchParams();

        useEffect(() => {
            if (!user.isFetching && !user.data) {
                const redirectTo = searchParams?.get('redirectTo') ?? '';
                if (pathname !== '/profile' ) {
                    if(redirectTo === '') router.replace('/profile');
                    else router.replace(`/profile?redirectTo=${encodeURIComponent(redirectTo)}`);
                }
            }
        }, [pathname, router, searchParams, user.data, user.isFetching]);

        return (user.isFetching) ? <Spinner /> : <Component {...props} />;
    };
}
