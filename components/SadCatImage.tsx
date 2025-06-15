'use-client';
import Image from 'next/image';
import React from 'react';

type SadCatImageProps = {
    height?: number;
};

const SadCatImage = (props: SadCatImageProps): React.ReactElement => {
    const DEFAULT_IMAGE_HEIGHT = 400;
    const URL = 'https://cataas.com/cat/sad';
    return (
        <Image
            src={URL}
            alt='Sad cat Image'
            height={props.height ?? DEFAULT_IMAGE_HEIGHT}
            width={props.height ?? DEFAULT_IMAGE_HEIGHT}
        />
    );
};

export default SadCatImage;
