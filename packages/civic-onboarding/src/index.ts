export class CivicOnboarding {
  private tosAccepted: boolean = false;
  private seedVerified: boolean = false;

  acceptTOS(): boolean {
    this.tosAccepted = true;
    return true;
  }

  verifySeed(words: string[]): boolean {
    if (words.length < 3) throw new Error("Need at least 3 words for verification");
    this.seedVerified = true;
    return true;
  }

  getStatus(): any {
    return {
      tosAccepted: this.tosAccepted,
      seedVerified: this.seedVerified,
      onboardingComplete: this.tosAccepted && this.seedVerified
    };
  }
}
