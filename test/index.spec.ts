import { MatlabSession } from '../src';

describe('index', () => {
  describe('MatlabSession', () => {
    it('should return a truthy value', () => {
      const session = new MatlabSession();
      expect(session).toBeTruthy();
    });
  });
});
