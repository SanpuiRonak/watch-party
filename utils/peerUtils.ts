import { Peer, User } from '@/interfaces/models';

const getPeerFromUser = (user: User, peerId: string): Peer => ({ userData: user, peerId  });

export { getPeerFromUser };
