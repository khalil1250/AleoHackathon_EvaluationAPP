// The 'test_permission_GrantHack' test program.
import permission_GrantHack.aleo;
program test_permission_GrantHack.aleo {
    @test
    script test_it() {
        let result: u32 = permission_GrantHack.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = permission_GrantHack.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }
}
