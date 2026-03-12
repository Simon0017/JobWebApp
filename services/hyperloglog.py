import hashlib
import math
import struct


__author__ = "Simon"


class Hyperloglog:
    def __init__(self,precision = 12):
        self.b = precision
        self.m = 1 << precision # no of registers 2^b 
        '''a: The integer whose bits are to be shifted.
        b: The number of places to shift the bits to the left. 
        The operation a << b is equivalent to multiplying a by 
        . The empty positions created on the right are filled with zeros'''
        self.registers = [0] * self.m # intilizing all registers to 0

        # bias correction
        if self.m >= 128:
            self.alpha = 0.7213 / (1 + 1.079 / self.m)
        elif self.m == 64:
            self.alpha = 0.709
        elif self.m == 32:
            self.alpha = 0.697
        else:
            self.alpha = 0.673
        

    def _hash(self,item):
        """Hash item to a 64-bit integer using SHA-1."""
        h = hashlib.sha1(str(item).encode()).digest()
        return struct.unpack('>Q', h[:8])[0] # first 8 bytes as uint64 


    def _leading_zeros(self,value,max_bits = 64):
        '''Count leading zeros in the binary rep'''
        if value == 0:
            return max_bits + 1
        count = 1
        while not (value & (1 << (max_bits - 1))):
            value <<= 1
            count += 1
        return count



    def add(self,item):
        '''Add item to the hyperloglog sketch'''
        h = self._hash(item)
        # use top b bits as register index
        register_index = h >> (64 - self.b) 
        ''' >> bitwise right-shift operator. It shifts the bits of the left operand to the right by the number of places specified by the right operand. 
        This is effectively equivalent to integer (floor) division by a power of 2.'''
        # remaining zeros for leading zero count
        remaining = (h << self.b) & ((1 << 64) - 1) # & but wise AND operator
        rho = self._leading_zeros(remaining,64-self.b) + 1

        # keep the maximum
        if rho > self.registers[register_index]:
            self.registers[register_index] = rho

    def count(self):
        '''Estimate the cardinality of the set'''
        # raw harmonic mean estimate
        Z = self.alpha * self.m ** 2 / sum(2 ** -r for r in self.registers)

        # small range correction
        if Z <= 2.5 * self.m:
            zeros = self.registers.count(0)
            if zeros > 0:
                Z = self.m * math.log(self.m / zeros)
        
        # Large range correction
        elif Z > (1 / 30) * (1 << 64):
            Z = -(1 << 64) * math.log(1 - Z / (1 << 64))

        # return the estimate
        return int(Z)

    def merge(self,other):
        """Merge another HLL sketch into this one (union cardinality)."""
        assert self.b == other.b, 'Precision must match to merge'
        for i in range(self.m):
            self.registers[i] = max(self.registers[i], other.registers[i])

