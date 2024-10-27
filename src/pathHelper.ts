import { GITHUB_REPOSITORY_NAME } from "./constants";

export const getPathWithGithubRepositorySlug = (path: string) => `/${GITHUB_REPOSITORY_NAME}${path}`