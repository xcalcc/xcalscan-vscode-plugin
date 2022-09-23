import simpleGit, {SimpleGit} from 'simple-git';

class GitManager {
    private baseDir: string;
    private gitOption?: object;

    constructor(baseDir: string, gitOption?: object) {
        this.baseDir = baseDir;
        this.gitOption = gitOption;
    }

    public async getBranchName(): Promise<string | undefined> {
        const git: SimpleGit = simpleGit(this.baseDir, this.gitOption);

        let bnranchSummary;

        try {
            bnranchSummary = await git.branchLocal();
        } catch(e) {
            return undefined;
        }

        return bnranchSummary.current;
    }
}

export default GitManager;