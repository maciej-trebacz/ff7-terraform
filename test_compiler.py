from unittest import TestCase
from io import StringIO

from compiler import Compiler
from lark import Lark


class CompilerTest(TestCase):
    @staticmethod
    def assert_compiled(input, output):
        file_mock = StringIO(input)
        compiler = Compiler(file_mock)
        compiled = bytes(compiler.compile()).hex()
        expected = output.replace(' ', '')
        assert compiled == expected, 'Actual output doesn\'t match expected output:\n'

    def test_end(self):
        CompilerTest.assert_compiled('End', '0302')

    def test_simple_func(self):
        CompilerTest.assert_compiled('PlayLayerAnimation(0x06)', '1001 0600 4a03')

    def test_nested_func(self):
        CompilerTest.assert_compiled('WriteTo(TempByte(2), SpecialByte(15))', '1901 0200 1b01 0f00 e000')

    def test_constants(self):
        CompilerTest.assert_compiled('SetEntityDirection(SpecialByte($EntityDirection) + 128)',
                                     '1b01 0400 1001 8000 4000 0403')

    def test_savemap_and_math(self):
        CompilerTest.assert_compiled('WriteTo(SavemapBit(0x0F29, 3), 1)', '1401 2b1c 1001 0100 e000')
        CompilerTest.assert_compiled('WriteTo(SavemapByte(0x0C14), SavemapByte(0x0C14) - 1)', '1801 8003 1801 8003 1001 0100 4100 e000')
        CompilerTest.assert_compiled('SetEntityAltitudeOffset(SavemapWord(0x0C16) - 3685 >> 1)', '1c01 9003 1001 650e 4100 1001 0100 5100 0b03')
        CompilerTest.assert_compiled('WriteTo(TempByte(0), SpecialByte($Random8BitNumber) * 9 >> 8)', '1901 0000 1b01 1000 1001 0900 3000 1001 0800 5100 e000')


    # def test_simple_value(self):
    #     CompilerTest.assert_compiled('6', '1001 0600')
    #
    # def test_simple_math_operations(self):
    #     CompilerTest.assert_compiled('1 + 4', '1001 0100 1001 0400 4000')
    #     CompilerTest.assert_compiled('5 - 3', '1001 0500 1001 0300 4100')
    #     CompilerTest.assert_compiled('2 * 8', '1001 0200 1001 0800 3000')
    #
    # def test_parenthesis_math(self):
    #     CompilerTest.assert_compiled('2 * (3 + 4)', '1001 0400 1001 0300 4000 1001 0200 3000')


class ParserTest(TestCase):
    @staticmethod
    def parse(prog):
        with open('world_script.lark') as f:
            grammar = f.read()

        parser = Lark(grammar, start='program', parser='lalr', lexer='standard')
        t = parser.parse(prog)
        print(t.pretty())
        return t.children

    def test_end(self):
        lines = ParserTest.parse("End")

        assert lines[0] == 'End'

    def test_simple_func(self):
        lines = ParserTest.parse("TestFunc()")

        assert lines[0].data == 'opcode'
        assert lines[0].children[0] == 'TestFunc'

    def test_simple_prog(self):
        lines = ParserTest.parse("""
            TestFunc1()
            TestFunc2()
            
            End
        """)

        assert lines[0].data == 'opcode'
        assert lines[0].children[0] == 'TestFunc1'
        assert lines[1].data == 'opcode'
        assert lines[1].children[0] == 'TestFunc2'
        assert lines[2] == 'End'

    def test_func_params(self):
        lines = ParserTest.parse("""
            TestFunc1(123)
            TestFunc1(4, 6)
            TestFunc2(-256)
        """)

        assert lines[0].children[1].data == 'arguments'
        assert len(lines[0].children[1].children) == 1
        assert lines[0].children[1].children[0].data == 'value'
        assert lines[0].children[1].children[0].children[0] == '123'
        assert len(lines[1].children[1].children) == 2
        assert lines[1].children[1].children[1].children[0] == '6'
        assert lines[2].children[1].children[0].data == 'negation'
        assert lines[2].children[1].children[0].children[0].data == 'value'
        assert lines[2].children[1].children[0].children[0].children[0] == '256'

    def test_nested_func(self):
        lines = ParserTest.parse("""
            TestFunc1(TestFunc2())
        """)

        assert lines[0].data == 'opcode'
        assert lines[0].children[0] == 'TestFunc1'
        assert lines[0].children[1].data == 'arguments'
        assert lines[0].children[1].children[0].data == 'opcode'
        assert lines[0].children[1].children[0].children[0] == 'TestFunc2'

    def test_complex_if(self):
        lines = ParserTest.parse("""
            If GetDistanceToModel(SpecialByte($PlayerEntityModelId)) <= 75 Then
            WriteTo(Frames(10))
            EndIf
            TestFunc(123)
            GoTo @LABEL_1
            @LABEL_1
        """)